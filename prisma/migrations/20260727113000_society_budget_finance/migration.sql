CREATE TABLE IF NOT EXISTS "society_budget" (
    "budget_id" SERIAL NOT NULL,
    "society_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "approved_by_admin_id" INTEGER,
    "title" TEXT NOT NULL,
    "academic_year" TEXT,
    "notes" TEXT,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_data" BYTEA NOT NULL,
    "budget_status" TEXT NOT NULL DEFAULT 'Pending Treasurer Approval',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "society_budget_pkey" PRIMARY KEY ("budget_id")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'society_budget_society_id_fkey'
    ) THEN
        ALTER TABLE "society_budget"
        ADD CONSTRAINT "society_budget_society_id_fkey"
        FOREIGN KEY ("society_id") REFERENCES "society"("society_id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'society_budget_admin_id_fkey'
    ) THEN
        ALTER TABLE "society_budget"
        ADD CONSTRAINT "society_budget_admin_id_fkey"
        FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'society_budget_approved_by_admin_id_fkey'
    ) THEN
        ALTER TABLE "society_budget"
        ADD CONSTRAINT "society_budget_approved_by_admin_id_fkey"
        FOREIGN KEY ("approved_by_admin_id") REFERENCES "admin"("admin_id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "society_budget_society_id_budget_status_submitted_at_idx"
ON "society_budget"("society_id", "budget_status", "submitted_at");

CREATE INDEX IF NOT EXISTS "society_budget_admin_id_submitted_at_idx"
ON "society_budget"("admin_id", "submitted_at");
