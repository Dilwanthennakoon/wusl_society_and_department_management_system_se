CREATE TABLE IF NOT EXISTS "society_application" (
    "application_id" SERIAL NOT NULL,
    "society_id" INTEGER,
    "admin_id" INTEGER NOT NULL,
    "application_type" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "society_name" TEXT NOT NULL,
    "communication_address" TEXT,
    "constitution_enforced_date" TIMESTAMP(3),
    "constitution_annex_note" TEXT,
    "bank_account_no" TEXT,
    "agm_date" TIMESTAMP(3),
    "senior_treasurer_name" TEXT,
    "senior_treasurer_designation" TEXT,
    "senior_treasurer_department" TEXT,
    "new_office_bearers" JSONB,
    "new_committee_members" JSONB,
    "previous_office_bearers" JSONB,
    "previous_committee_members" JSONB,
    "active_members_count" INTEGER,
    "members_annex_note" TEXT,
    "previous_year_activities" TEXT,
    "other_activities" TEXT,
    "difficulties_and_solutions" TEXT,
    "proposed_activity_plan" JSONB,
    "president_signature" TEXT,
    "secretary_signature" TEXT,
    "certification_date" TIMESTAMP(3),
    "certification_secretary_signature" TEXT,
    "application_status" TEXT NOT NULL DEFAULT 'Draft',
    "change_request" TEXT,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "society_application_pkey" PRIMARY KEY ("application_id")
);

CREATE TABLE IF NOT EXISTS "society_application_review" (
    "review_id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "remarks" TEXT,
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "society_application_review_pkey" PRIMARY KEY ("review_id")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'society_application_society_id_fkey'
    ) THEN
        ALTER TABLE "society_application"
        ADD CONSTRAINT "society_application_society_id_fkey"
        FOREIGN KEY ("society_id") REFERENCES "society"("society_id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'society_application_admin_id_fkey'
    ) THEN
        ALTER TABLE "society_application"
        ADD CONSTRAINT "society_application_admin_id_fkey"
        FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'society_application_review_application_id_fkey'
    ) THEN
        ALTER TABLE "society_application_review"
        ADD CONSTRAINT "society_application_review_application_id_fkey"
        FOREIGN KEY ("application_id") REFERENCES "society_application"("application_id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'society_application_review_admin_id_fkey'
    ) THEN
        ALTER TABLE "society_application_review"
        ADD CONSTRAINT "society_application_review_admin_id_fkey"
        FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;
