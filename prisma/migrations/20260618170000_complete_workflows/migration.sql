ALTER TABLE "registration"
ADD COLUMN IF NOT EXISTS "reason" TEXT;

ALTER TABLE "event"
ALTER COLUMN "society_id" DROP NOT NULL,
ADD COLUMN IF NOT EXISTS "department_id" INTEGER,
ADD COLUMN IF NOT EXISTS "workflow_type" TEXT NOT NULL DEFAULT 'Society',
ADD COLUMN IF NOT EXISTS "change_request" TEXT,
ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "published_at" TIMESTAMP(3);

ALTER TABLE "event_image"
ADD COLUMN IF NOT EXISTS "media_type" TEXT NOT NULL DEFAULT 'Image',
ADD COLUMN IF NOT EXISTS "file_name" TEXT;

CREATE TABLE IF NOT EXISTS "event_review" (
    "review_id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "remarks" TEXT,
    "reviewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_review_pkey" PRIMARY KEY ("review_id")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'event_department_id_fkey'
    ) THEN
        ALTER TABLE "event"
        ADD CONSTRAINT "event_department_id_fkey"
        FOREIGN KEY ("department_id") REFERENCES "department"("department_id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'event_review_event_id_fkey'
    ) THEN
        ALTER TABLE "event_review"
        ADD CONSTRAINT "event_review_event_id_fkey"
        FOREIGN KEY ("event_id") REFERENCES "event"("event_id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'event_review_admin_id_fkey'
    ) THEN
        ALTER TABLE "event_review"
        ADD CONSTRAINT "event_review_admin_id_fkey"
        FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;
