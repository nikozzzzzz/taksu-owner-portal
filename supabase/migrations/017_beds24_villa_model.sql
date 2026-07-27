-- 017_beds24_villa_model.sql

-- 1. Relax NOT NULL constraints on legacy Taksu-specific fields so we can auto-import from Beds24
ALTER TABLE villas ALTER COLUMN villa_type DROP NOT NULL;
ALTER TABLE villas ALTER COLUMN bedrooms DROP NOT NULL;
ALTER TABLE villas ALTER COLUMN bathrooms DROP NOT NULL;
ALTER TABLE villas ALTER COLUMN max_guests DROP NOT NULL;
ALTER TABLE villas ALTER COLUMN phase DROP NOT NULL;
ALTER TABLE villas ALTER COLUMN ownership_type DROP NOT NULL;

-- 2. Add Beds24 property fields
ALTER TABLE villas
  ADD COLUMN address TEXT,
  ADD COLUMN city TEXT,
  ADD COLUMN state TEXT,
  ADD COLUMN country TEXT,
  ADD COLUMN postcode TEXT,
  ADD COLUMN latitude DECIMAL(10,7),
  ADD COLUMN longitude DECIMAL(10,7),
  ADD COLUMN phone TEXT,
  ADD COLUMN email TEXT,
  ADD COLUMN currency TEXT,
  ADD COLUMN beds24_property_type TEXT,
  ADD COLUMN check_in_start TEXT,
  ADD COLUMN check_in_end TEXT,
  ADD COLUMN check_out_end TEXT;
