-- Add species and airesponse columns to photos table
ALTER TABLE photos 
ADD COLUMN IF NOT EXISTS species VARCHAR(255),
ADD COLUMN IF NOT EXISTS airesponse TEXT;

-- Add index on species for faster searches
CREATE INDEX IF NOT EXISTS idx_photos_species ON photos(species) WHERE species IS NOT NULL;

