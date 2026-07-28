import { createServerSupabaseClient, createServiceRoleSupabaseClient } from '@/lib/supabase/server';

const BEDS24_API_URL = 'https://api.beds24.com/v2';

/**
 * Beds24 API v2 Client
 *
 * Design decisions:
 * - NO in-memory token caching: Next.js serverless functions can be restarted at any time.
 *   Tokens are always loaded from the DB before use.
 * - Token refresh uses a per-request lock via a module-level Promise to avoid race conditions
 *   when two requests simultaneously receive a 401.
 * - Beds24 sometimes returns 500 "Could not process request" for expired tokens instead of 401.
 *   The request() function detects this and attempts a refresh automatically.
 * - All API errors are logged with full context before being re-thrown.
 */

// Module-level refresh lock to prevent simultaneous token refresh race conditions
let refreshPromise: Promise<string> | null = null;

import fs from 'fs/promises';
import path from 'path';

export async function logApiCall(
  direction: 'inbound' | 'outbound',
  endpoint: string,
  payload: any,
  status: number | null,
  responseBody: any,
  errorMessage: string | null
) {
  try {
    const logEntry = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      service: 'beds24',
      direction,
      endpoint,
      payload,
      response_status: status,
      response_body: typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody),
      error_message: errorMessage,
    };
    
    const logsDir = path.join(process.cwd(), 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    const logFile = path.join(logsDir, 'beds24_api_logs.jsonl');

    try {
      const stats = await fs.stat(logFile);
      // If log exceeds 10MB, rotate it to .old
      if (stats.size > 10 * 1024 * 1024) {
        await fs.rename(logFile, `${logFile}.old`);
      }
    } catch (e) {
      // File doesn't exist yet, safe to ignore
    }

    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
  } catch (err) {
    console.error('[Beds24] Failed to save API log to file:', err);
  }
}


async function loadCredentials(): Promise<{ token: string; refreshToken: string; id: string } | null> {
  const supabase = (await createServerSupabaseClient()) as any;
  const { data, error } = await supabase
    .from('beds24_credentials')
    .select('id, token, refresh_token')
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }
  return { token: data.token, refreshToken: data.refresh_token, id: data.id };
}

async function saveCredentials(id: string, token: string, refreshToken: string): Promise<void> {
  const supabase = (await createServerSupabaseClient()) as any;
  const { error } = await supabase
    .from('beds24_credentials')
    .update({ token, refresh_token: refreshToken, last_sync_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[Beds24] Failed to save credentials to DB:', error);
    throw new Error('Failed to persist refreshed token');
  }
}

async function insertCredentials(token: string, refreshToken: string): Promise<void> {
  const supabase = (await createServerSupabaseClient()) as any;
  const { error } = await supabase
    .from('beds24_credentials')
    .insert({ token, refresh_token: refreshToken, last_sync_at: new Date().toISOString() });

  if (error) {
    console.error('[Beds24] Failed to insert credentials to DB:', error);
    throw new Error('Failed to persist credentials');
  }
}

async function doRefreshToken(refreshToken: string, credentialId: string): Promise<string> {
  console.log('[Beds24] Refreshing access token...');
  const response = await fetch(`${BEDS24_API_URL}/authentication/token`, {
    method: 'GET',
    headers: { refreshToken },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Beds24] Token refresh failed (${response.status}):`, errText);
    throw new Error(`Beds24 token refresh failed: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error('[Beds24] No token returned from refresh endpoint');
  }

  await saveCredentials(credentialId, data.token, refreshToken);
  console.log('[Beds24] Token refreshed successfully.');
  return data.token;
}

/**
 * Core authenticated request method.
 * Loads credentials from DB on each call (no in-memory cache).
 * Handles:
 *  - 401: token refresh + retry (race-condition safe)
 *  - 429: backoff + retry
 *  - 500 "Could not process": Beds24's non-standard way of saying "token expired" — auto-refresh + retry
 */
export async function request(
  endpoint: string,
  options: RequestInit = {},
  attempt = 0
): Promise<any> {
  if (attempt > 2) {
    throw new Error(`[Beds24] Max retries exceeded for ${endpoint}`);
  }

  const credentials = await loadCredentials();
  if (!credentials) {
    throw new Error(
      '[Beds24] Credentials not found. Please connect the Beds24 account first via Admin > Integrations.'
    );
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    token: credentials.token,
    ...((options.headers as Record<string, string>) || {}),
  };

  console.log(`[Beds24] -> ${options.method || 'GET'} ${endpoint} (attempt ${attempt + 1})`);

  const loggedFetch = async (url: string, fetchOptions: RequestInit) => {
    const res = await fetch(url, fetchOptions);
    let bodyText = '';
    try { bodyText = await res.text(); } catch { /* ignore */ }
    
    // Parse JSON if possible for prettier logging
    let parsedBody: any = bodyText;
    try { parsedBody = JSON.parse(bodyText); } catch { /* ignore */ }
    
    // Determine payload
    let parsedPayload: any = fetchOptions.body;
    if (typeof fetchOptions.body === 'string') {
      try { parsedPayload = JSON.parse(fetchOptions.body); } catch { /* ignore */ }
    }
    
    await logApiCall(
      'outbound',
      url.replace(BEDS24_API_URL, ''),
      parsedPayload,
      res.status,
      parsedBody,
      !res.ok ? `HTTP ${res.status} ${res.statusText}` : null
    );
    
    // Create a new Response object because we consumed the stream with .text()
    return new Response(bodyText, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers
    });
  };

  let response = await loggedFetch(`${BEDS24_API_URL}${endpoint}`, { ...options, headers });

  // ── Shared token-refresh helper (shared promise = no race conditions) ────────
  const attemptRefresh = async (): Promise<string> => {
    if (!refreshPromise) {
      refreshPromise = doRefreshToken(credentials.refreshToken, credentials.id).finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  };

  const reconnectMsg =
    'Your Beds24 session has expired. Please reconnect via Admin -> Integrations -> Beds24 using a new Invite Code.';

  // --- Handle token expiry (401) ---
  if (response.status === 401) {
    console.warn(`[Beds24] 401 Unauthorized on ${endpoint}. Attempting token refresh.`);
    let newToken: string;
    try {
      newToken = await attemptRefresh();
    } catch (err: any) {
      console.error('[Beds24] Token refresh failed after 401:', err);
      throw new Error(reconnectMsg);
    }
    headers['token'] = newToken;
    response = await loggedFetch(`${BEDS24_API_URL}${endpoint}`, { ...options, headers });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Beds24] Still failing after token refresh (${response.status}):`, errText);
      throw new Error(`Beds24 API Error after token refresh: ${response.status} ${response.statusText}`);
    }
  }

  // --- Handle rate limiting (429) ---
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '10', 10);
    const waitMs = retryAfter * 1000;
    console.warn(`[Beds24] Rate limited. Waiting ${waitMs}ms before retry...`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return request(endpoint, options, attempt + 1);
  }

  // --- Handle 500 that may signal a stale/expired token ───────────────────────
  // Beds24 returns 500 "Could not process request" instead of 401 for expired tokens.
  // On the first attempt, try a refresh. If the refresh also fails, ask user to reconnect.
  if (response.status === 500 && attempt === 0) {
    const errText = await response.text();
    let errBody: any = {};
    try { errBody = JSON.parse(errText); } catch { /* ignore */ }

    const looksLikeTokenError =
      String(errBody?.error ?? '').toLowerCase().includes('could not process') ||
      String(errBody?.error ?? '').toLowerCase().includes('token') ||
      errBody?.code === 500;

    if (looksLikeTokenError) {
      console.warn(`[Beds24] 500 on ${endpoint} — likely stale token, attempting refresh.`);
      try {
        const newToken = await attemptRefresh();
        headers['token'] = newToken;
        return request(endpoint, { ...options, headers }, attempt + 1);
      } catch (refreshErr: any) {
        console.error('[Beds24] Refresh token also expired:', refreshErr);
        throw new Error(reconnectMsg);
      }
    }

    // Genuine server error from Beds24
    console.error(`[Beds24] API Error (500) on ${endpoint}:`, errText);
    throw new Error(`Beds24 API Error: 500 Internal Server Error -- ${errText}`);
  }

  // --- Handle other errors ---
  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Beds24] API Error (${response.status}) on ${endpoint}:`, errText);
    throw new Error(`Beds24 API Error: ${response.status} ${response.statusText} -- ${errText}`);
  }

  // 204 No Content
  if (response.status === 204) {
    return null;
  }

  const result = await response.json();
  console.log(`[Beds24] <- ${response.status} OK for ${endpoint}`);
  return result;
}

// --- Public API ---------------------------------------------------------------

/**
 * Exchange an Invite Code for long-lived tokens.
 * Called only once during initial setup from the Admin UI.
 */
export async function setupBeds24Connection(inviteCode: string): Promise<boolean> {
  const response = await fetch(`${BEDS24_API_URL}/authentication/setup`, {
    method: 'GET',
    headers: { code: inviteCode },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[Beds24] Setup failed:', errText);
    throw new Error(`Beds24 setup failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.token || !data.refreshToken) {
    throw new Error('[Beds24] Setup response did not contain token or refreshToken');
  }

  // Check if credentials already exist (re-connect scenario)
  const existing = await loadCredentials();
  if (existing) {
    await saveCredentials(existing.id, data.token, data.refreshToken);
  } else {
    await insertCredentials(data.token, data.refreshToken);
  }
  console.log('[Beds24] Connection established successfully.');
  return true;
}

/** Fetch all properties for this Beds24 account */
export async function getBeds24Properties(): Promise<any[]> {
  const result = await request('/properties');
  return Array.isArray(result) ? result : (result?.data ?? []);
}

/** Fetch all rooms for a specific property */
export async function getBeds24Rooms(propertyId: number): Promise<any[]> {
  const result = await request(`/inventory/rooms?propertyId=${propertyId}`);
  return Array.isArray(result) ? result : (result?.data ?? []);
}

/**
 * Fetch bookings from Beds24, optionally filtered by property and date range.
 * dateFrom / dateTo filter by arrival date.
 */
export async function getBeds24Bookings(options: {
  propertyId?: number;
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string;   // YYYY-MM-DD
  includeStatuses?: string[];
} = {}): Promise<any[]> {
  const params = new URLSearchParams();
  if (options.propertyId) params.set('propertyId', String(options.propertyId));
  if (options.dateFrom)   params.set('dateFrom', options.dateFrom);
  if (options.dateTo)     params.set('dateTo',   options.dateTo);
  const statuses = options.includeStatuses ?? ['0', '1', '2', '3', '9'];
  params.set('includeInactive', 'true');

  const qs = params.toString() ? `?${params.toString()}` : '';
  const result = await request(`/bookings${qs}`);
  const all = Array.isArray(result) ? result : (result?.data ?? []);

  return all.filter((b: any) => statuses.includes(String(b.status ?? '')));
}

/**
 * Fetch calendar availability for a property/room between two dates.
 */
export async function getBeds24Availability(options: {
  propertyId: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  roomId?: number;
}): Promise<any[]> {
  const params = new URLSearchParams({
    propertyId: String(options.propertyId),
    startDate:  options.startDate,
    endDate:    options.endDate,
  });
  if (options.roomId) params.set('roomId', String(options.roomId));

  const result = await request(`/inventory/availability?${params.toString()}`);
  return Array.isArray(result) ? result : (result?.data ?? []);
}

/**
 * Block a range of dates on the Beds24 calendar (create a maintenance block).
 */
export async function blockBeds24Calendar(options: {
  propertyId: number;
  roomId: number;
  arrival: string;   // YYYY-MM-DD
  departure: string; // YYYY-MM-DD
  notes?: string;
}): Promise<number | null> {
  const result = await request('/bookings', {
    method: 'POST',
    body: JSON.stringify([{
      propertyId: options.propertyId,
      roomId:     options.roomId,
      arrival:    options.arrival,
      departure:  options.departure,
      status:     '9', // BLOCKED
      firstName:  'Taksu',
      lastName:   'Block',
      notes:      options.notes ?? 'Blocked via Taksu Owner Portal',
    }]),
  });
  if (Array.isArray(result) && result[0]?.id) return result[0].id as number;
  return null;
}

/**
 * Push a new booking to Beds24 (outbound sync).
 * Returns the newly created Beds24 booking ID, or null if the push failed.
 */
export async function pushBookingToBeds24(payload: {
  propertyId: number;
  roomId: number;
  arrival: string;   // YYYY-MM-DD
  departure: string; // YYYY-MM-DD
  firstName: string;
  lastName: string;
  status: string;    // 'confirmed' | 'cancelled' | 'black' | 'new'
  price?: number;
  notes?: string;
}): Promise<number | null> {
  if (!payload.arrival || !payload.departure) {
    throw new Error('[Beds24] Cannot push booking without arrival and departure dates');
  }
  if (!payload.propertyId || !payload.roomId) {
    throw new Error('[Beds24] Cannot push booking without propertyId and roomId');
  }

  const result = await request('/bookings', {
    method: 'POST',
    body: JSON.stringify([payload]),
  });

  if (Array.isArray(result) && result[0]) {
    const b24 = result[0];
    const createdId = b24.id || b24.new?.id;

    if (b24.success === false && b24.errors?.length > 0) {
      const errorMsg = b24.errors[0]?.message || 'Unknown Beds24 error';
      throw new Error(`Beds24 Error: ${errorMsg}`);
    }
    
    if (createdId) {
      if (b24.success === false && b24.warnings?.length > 0) {
        console.warn('[Beds24] Booking created but with warnings:', b24.warnings);
      }
      return createdId as number;
    }
    
    // If it failed and no ID was created
    if (b24.success === false) {
       const msg = b24.warnings?.[0]?.message || 'Unknown Beds24 error';
       throw new Error(`Beds24 Error: ${msg}`);
    }
  }
  
  console.warn('[Beds24] pushBooking response did not contain an ID:', result);
  return null;
}

/**
 * Update an existing booking in Beds24 (outbound sync for edits).
 */
export async function updateBeds24Booking(
  beds24BookingId: number,
  updates: {
    arrival?: string;
    departure?: string;
    firstName?: string;
    lastName?: string;
    status?: string;
    price?: number;
  }
): Promise<void> {
  const result = await request('/bookings', {
    method: 'POST', // Beds24 v2 uses POST with ID present = update
    body: JSON.stringify([{ id: beds24BookingId, ...updates }]),
  });
  
  if (Array.isArray(result) && result[0]) {
    const b24 = result[0];
    if (b24.success === false && b24.errors?.length > 0) {
      const errorMsg = b24.errors[0]?.message || 'Unknown Beds24 error';
      throw new Error(`Beds24 Error: ${errorMsg}`);
    }
    
    if (b24.success === false && (!b24.id && !b24.new?.id)) {
      const errorMsg = b24.warnings?.[0]?.message || 'Unknown Beds24 error';
      throw new Error(`Beds24 Error: ${errorMsg}`);
    }
  }
}

/**
 * Cancel a booking in Beds24.
 */
export async function cancelBeds24Booking(beds24BookingId: number): Promise<void> {
  await updateBeds24Booking(beds24BookingId, { status: 'cancelled' });
}
