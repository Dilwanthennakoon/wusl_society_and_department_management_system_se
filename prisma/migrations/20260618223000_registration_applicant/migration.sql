ALTER TABLE "registration"
ADD COLUMN IF NOT EXISTS "applicant_id" INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'registration_applicant_id_fkey'
    ) THEN
        ALTER TABLE "registration"
        ADD CONSTRAINT "registration_applicant_id_fkey"
        FOREIGN KEY ("applicant_id") REFERENCES "admin"("admin_id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;
