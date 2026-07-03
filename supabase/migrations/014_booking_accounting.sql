-- Add payout tracking to bookings
ALTER TABLE bookings
ADD COLUMN payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'received', 'disputed')),
ADD COLUMN payout_date DATE;

-- Update existing bookings to have pending status
UPDATE bookings SET payout_status = 'pending' WHERE status = 'confirmed';

-- Add booking reference to invoices
ALTER TABLE accounting_invoices
ADD COLUMN booking_id UUID REFERENCES bookings(id);

-- Add index for efficient querying of pending payouts
CREATE INDEX idx_bookings_payout_status ON bookings(payout_status);
