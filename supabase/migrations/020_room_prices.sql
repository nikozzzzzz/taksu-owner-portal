-- 020_room_prices.sql

CREATE TABLE IF NOT EXISTS room_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  villa_id UUID NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  price_idr DECIMAL(12,2),
  price_usd DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(villa_id, date)
);

-- Enable RLS
ALTER TABLE room_prices ENABLE ROW LEVEL SECURITY;

-- Allow reading for anyone who can see the villa
CREATE POLICY "room_prices_read_policy"
  ON room_prices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM villas v
      WHERE v.id = room_prices.villa_id
      AND (
        -- Admins and roots can see everything
        EXISTS (
          SELECT 1 FROM owners o 
          WHERE o.auth_user_id = auth.uid() 
          AND o.role IN ('admin', 'root')
        )
        OR
        -- Investors can see their own villas
        v.owner_id = (SELECT id FROM owners WHERE auth_user_id = auth.uid())
      )
    )
  );

-- Allow modifying only for admins
CREATE POLICY "room_prices_write_policy"
  ON room_prices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM owners 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'root')
    )
  );
