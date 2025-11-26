-- AlterTable Scenario: Convert content from TEXT to JSONB
DO $$
BEGIN
  -- Check if content column exists and is TEXT type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Scenario'
    AND column_name = 'content'
    AND data_type = 'text'
  ) THEN
    -- Convert existing text content to TipTap JSON format
    UPDATE "Scenario"
    SET content = jsonb_build_object(
      'type', 'doc',
      'content', jsonb_build_array(
        jsonb_build_object(
          'type', 'paragraph',
          'content', jsonb_build_array(
            jsonb_build_object('type', 'text', 'text', content)
          )
        )
      )
    )::text
    WHERE content IS NOT NULL
    AND content !~ '^\s*\{';  -- Only convert if not already JSON

    -- Change column type to JSONB
    ALTER TABLE "Scenario" ALTER COLUMN "content" TYPE JSONB USING content::jsonb;
  END IF;
END $$;

-- AlterTable Procedure: Remove old fields and convert steps to JSONB
DO $$
BEGIN
  -- Drop indications column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Procedure'
    AND column_name = 'indications'
  ) THEN
    ALTER TABLE "Procedure" DROP COLUMN "indications";
  END IF;

  -- Drop contraindications column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Procedure'
    AND column_name = 'contraindications'
  ) THEN
    ALTER TABLE "Procedure" DROP COLUMN "contraindications";
  END IF;

  -- Drop equipment column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Procedure'
    AND column_name = 'equipment'
  ) THEN
    ALTER TABLE "Procedure" DROP COLUMN "equipment";
  END IF;

  -- Convert steps from TEXT to JSONB
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Procedure'
    AND column_name = 'steps'
    AND data_type = 'text'
  ) THEN
    -- Convert existing text steps to TipTap JSON format
    UPDATE "Procedure"
    SET steps = jsonb_build_object(
      'type', 'doc',
      'content', jsonb_build_array(
        jsonb_build_object(
          'type', 'paragraph',
          'content', jsonb_build_array(
            jsonb_build_object('type', 'text', 'text', steps)
          )
        )
      )
    )::text
    WHERE steps IS NOT NULL
    AND steps !~ '^\s*\{';  -- Only convert if not already JSON

    -- Change column type to JSONB
    ALTER TABLE "Procedure" ALTER COLUMN "steps" TYPE JSONB USING steps::jsonb;
  END IF;
END $$;
