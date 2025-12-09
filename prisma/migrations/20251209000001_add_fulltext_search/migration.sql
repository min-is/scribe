-- Add full-text search indexes for better search performance
-- Using PostgreSQL's built-in full-text search with GIN indexes

-- Add tsvector column for full-text search on Page table
ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Create index on the tsvector column
CREATE INDEX IF NOT EXISTS "Page_search_vector_idx" ON "Page" USING GIN ("search_vector");

-- Create function to update search vector
CREATE OR REPLACE FUNCTION page_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."textContent", '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(COALESCE(NEW.tags, ARRAY[]::text[]), ' ')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector on insert/update
DROP TRIGGER IF EXISTS page_search_vector_trigger ON "Page";
CREATE TRIGGER page_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Page"
  FOR EACH ROW
  EXECUTE FUNCTION page_search_vector_update();

-- Update existing rows with search vectors
UPDATE "Page" SET search_vector =
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE("textContent", '')), 'B') ||
  setweight(to_tsvector('english', array_to_string(COALESCE(tags, ARRAY[]::text[]), ' ')), 'C')
WHERE search_vector IS NULL;
