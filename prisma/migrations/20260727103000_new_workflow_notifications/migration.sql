DROP TABLE IF EXISTS "notification";

CREATE TABLE IF NOT EXISTS "workflow_notification" (
    "workflow_notification_id" SERIAL NOT NULL,
    "recipient_admin_id" INTEGER NOT NULL,
    "actor_admin_id" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "notification_type" TEXT NOT NULL,
    "workflow_type" TEXT,
    "target_role" TEXT,
    "action_url" TEXT,
    "event_id" INTEGER,
    "society_application_id" INTEGER,
    "registration_id" INTEGER,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_notification_pkey" PRIMARY KEY ("workflow_notification_id")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'workflow_notification_recipient_admin_id_fkey'
    ) THEN
        ALTER TABLE "workflow_notification"
        ADD CONSTRAINT "workflow_notification_recipient_admin_id_fkey"
        FOREIGN KEY ("recipient_admin_id") REFERENCES "admin"("admin_id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'workflow_notification_actor_admin_id_fkey'
    ) THEN
        ALTER TABLE "workflow_notification"
        ADD CONSTRAINT "workflow_notification_actor_admin_id_fkey"
        FOREIGN KEY ("actor_admin_id") REFERENCES "admin"("admin_id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "workflow_notification_recipient_admin_id_read_at_created_at_idx"
ON "workflow_notification"("recipient_admin_id", "read_at", "created_at");

CREATE INDEX IF NOT EXISTS "workflow_notification_recipient_admin_id_created_at_idx"
ON "workflow_notification"("recipient_admin_id", "created_at");
