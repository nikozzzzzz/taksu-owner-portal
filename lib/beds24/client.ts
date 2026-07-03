import { createServerSupabaseClient } from '@/lib/supabase/server';

const BEDS24_API_URL = 'https://api.beds24.com/v2';

export class Beds24Client {
  private token: string | null = null;
  private refreshToken: string | null = null;

  private async loadCredentials() {
    const supabase = (await createServerSupabaseClient()) as any;
    const { data, error } = await supabase
      .from('beds24_credentials')
      .select('*')
      .limit(1)
      .single();
    
    if (data) {
      this.token = data.token;
      this.refreshToken = data.refresh_token;
    }
  }

  private async saveCredentials(token: string, refreshToken: string) {
    const supabase = (await createServerSupabaseClient()) as any;
    
    // Check if a row exists
    const { data: existing } = await supabase.from('beds24_credentials').select('id').limit(1).single();
    
    if (existing) {
      await supabase
        .from('beds24_credentials')
        .update({ token, refresh_token: refreshToken })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('beds24_credentials')
        .insert({ token, refresh_token: refreshToken });
    }
    
    this.token = token;
    this.refreshToken = refreshToken;
  }

  /**
   * Use the Invite Code to setup authentication for the first time
   */
  async setupConnection(inviteCode: string): Promise<boolean> {
    try {
      const response = await fetch(`${BEDS24_API_URL}/authentication/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'inviteCode': inviteCode
        }
      });
      
      if (!response.ok) {
        throw new Error(`Beds24 setup failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.token && data.refreshToken) {
        await this.saveCredentials(data.token, data.refreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error setting up Beds24 connection:', error);
      throw error;
    }
  }

  /**
   * Get a new token using the refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${BEDS24_API_URL}/authentication/token`, {
      method: 'GET',
      headers: {
        'refreshToken': this.refreshToken
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.token) {
      await this.saveCredentials(data.token, this.refreshToken);
      return data.token;
    }
    
    throw new Error('No token in refresh response');
  }

  /**
   * Internal method to perform authenticated API calls with automatic retry and token refresh
   */
  private async request(endpoint: string, options: RequestInit = {}, retries = 1): Promise<any> {
    if (!this.token) {
      await this.loadCredentials();
    }
    if (!this.token) {
      throw new Error('Beds24 credentials not found. Please connect the account first.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'token': this.token,
      ...(options.headers || {})
    };

    let response = await fetch(`${BEDS24_API_URL}${endpoint}`, {
      ...options,
      headers
    });

    // Handle token expiry (401)
    if (response.status === 401 && retries > 0) {
      console.log('Beds24 token expired, refreshing...');
      this.token = await this.refreshAccessToken();
      headers['token'] = this.token;
      response = await fetch(`${BEDS24_API_URL}${endpoint}`, {
        ...options,
        headers
      });
    }
    
    // Handle rate limit (429)
    if (response.status === 429 && retries > 0) {
      console.log('Beds24 rate limited, waiting 5 seconds before retry...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return this.request(endpoint, options, retries - 1);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Beds24 API Error (${response.status}):`, errorText);
      throw new Error(`Beds24 API Error: ${response.statusText}`);
    }

    // Return empty string for 204 No Content
    if (response.status === 204) {
      return '';
    }

    return await response.json();
  }

  // --- API Methods ---

  async getProperties() {
    return this.request('/inventory/properties');
  }

  async getRooms(propertyId: number) {
    return this.request(`/inventory/rooms?propertyId=${propertyId}`);
  }

  async pushBooking(payload: any) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify([payload]) // Beds24 expects an array
    });
  }

  async updateBookingStatus(bookingId: number, status: string) {
    return this.request('/bookings', {
      method: 'POST', // Beds24 v2 uses POST to bookings array for updates too if ID is provided
      body: JSON.stringify([{ id: bookingId, status }])
    });
  }
}

// Singleton instance
export const beds24Client = new Beds24Client();
