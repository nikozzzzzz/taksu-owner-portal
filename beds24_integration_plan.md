# Beds24 Integration (PMS Two-Way Sync)

This document outlines the technical specification for integrating the **Beds24 API v2** into the Taksu Owner Portal. This integration will upgrade the portal into a full-fledged Property Management System (PMS) capable of two-way synchronization with major aggregators (Airbnb, Booking.com, Agoda, Expedia) via Beds24's Channel Manager.

## User Review Required

> [!IMPORTANT]
> Please review the data mapping strategy below. Currently, Taksu uses `hostaway_listing_id`. We will need to replace or supplement this with `beds24_property_id` and `beds24_room_id`.

> [!WARNING]
> Beds24 API v2 uses a strict rate limit. We must rely heavily on **Webhooks (Auto Actions)** for inbound data rather than constant polling, to avoid API blocks.

## Open Questions

1. **Migration from Hostaway:** Are we entirely replacing Hostaway with Beds24, or will they run in parallel during a transition phase?
2. **Pricing Master:** Will Taksu be the master source of truth for pricing (pushing rates to Beds24), or will pricing be managed inside Beds24 (and pulled into Taksu for display)?
3. **Multi-Property Setup:** Does the management company use a single Beds24 Account, or do some investors have their own connected Beds24 accounts? (This determines if we need one global API token or per-owner API tokens).

---

## Architecture & Data Flow

### 1. Authentication (OAuth-like Flow)
Beds24 API v2 uses a token-based authentication system.
- We will create a `beds24_credentials` table (or store securely in environment variables if it's a single global account).
- **Setup Flow:** An administrator generates an "Invite Code" in the Beds24 Control Panel. In the Taksu Admin UI, they input this code. The system exchanges it via `POST /authentication/setup` to receive a `refreshToken` and an `token`.
- **Refresh Flow:** The `token` expires frequently (usually 24 hours). A background worker or middleware will automatically request a new token using the `refreshToken` via `GET /authentication/token`.

### 2. Database Schema Changes

#### `villas` table
We need to map Taksu villas to Beds24 hierarchy (Property -> Room).
- `[NEW]` `beds24_property_id` (Integer)
- `[NEW]` `beds24_room_id` (Integer)

#### `bookings` table
- `[NEW]` `beds24_booking_id` (Integer, Unique)
- `[NEW]` `beds24_status` (String - e.g., 'new', 'modified', 'cancelled')

### 3. Inbound Sync (Beds24 -> Taksu)

To maintain real-time accuracy without hitting API rate limits, we will use **Beds24 Auto Actions (Webhooks)**.

- **Endpoint:** Create a new Next.js API route `POST /api/webhooks/beds24`
- **Triggers:** Configure Beds24 Auto Actions to send JSON payloads to this endpoint on:
  1. New Booking
  2. Booking Modification
  3. Booking Cancellation
- **Fallback Polling:** A background cron job running every 1-2 hours calling `GET /bookings` with `modifiedSince` to catch any webhooks that failed to deliver.

### 4. Outbound Sync (Taksu -> Beds24)

To function as a true PMS, actions taken in Taksu must reflect on aggregators.

- **Direct Bookings:** When an admin creates a direct booking in Taksu, we fire `POST /bookings` to Beds24. This instantly blocks the dates on Airbnb, Booking.com, etc.
- **Cancellations:** If a direct booking is cancelled in Taksu, we send `PUT /bookings/{id}` with status `cancelled` to free up the calendar.
- *(Optional)* **Rates & Availability:** If Taksu becomes the Pricing Master, updating a villa's base price will trigger `POST /inventory/rooms` or `POST /prices` to push the new rates to all channels.

---

## Proposed Changes

### Database Layer
#### [MODIFY] supabase/migrations/014_beds24_integration.sql (to be created)
- Add `beds24_property_id` and `beds24_room_id` to `villas`.
- Add `beds24_booking_id` to `bookings`.
- Create `beds24_credentials` table with RLS restricted to admins only.

### API & Middleware Layer
#### [NEW] lib/beds24/client.ts
- Create a reusable API client for Beds24 API v2.
- Implement automatic token refreshing using the stored `refreshToken`.
- Implement retry logic for `HTTP 429 Too Many Requests`.

### Webhook Handlers
#### [NEW] app/api/webhooks/beds24/route.ts
- Receive incoming JSON payloads from Beds24.
- Validate payload security (using a custom secret header).
- Upsert booking data into the `bookings` table.

### Business Logic
#### [MODIFY] lib/actions/booking-actions.ts
- Intercept direct booking creation: after saving to the DB, push the booking to Beds24 via the API client.
- Intercept booking cancellations and push the status update to Beds24.

### User Interface
#### [NEW] app/(portal)/admin/settings/beds24/page.tsx
- Admin interface to input the Beds24 Invite Code.
- Button to trigger a manual "Full Sync" for properties and bookings.
- Display connection status and last successful sync timestamp.

---

## Verification Plan

### Automated Tests
- Mock the Beds24 API v2 endpoints to simulate authentication setup.
- Simulate incoming webhooks (New Booking, Cancelled Booking) and assert the `bookings` table updates correctly.
- Test that creating a direct booking in Taksu triggers an API call to Beds24.

### Manual Verification
1. Connect a staging Beds24 account using an Invite Code.
2. Create a dummy reservation in the Beds24 calendar and verify it appears in Taksu within seconds via Webhook.
3. Create a manual booking in Taksu and verify the dates get blocked in the Beds24 calendar.
