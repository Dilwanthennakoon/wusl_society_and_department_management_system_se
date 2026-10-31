CREATE TABLE IF NOT EXISTS "notification" (
    "notification_id" SERIAL NOT NULL,
    "recipient_admin_id" INTEGER NOT NULL,
    "actor_admin_id" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "notification_type" TEXT NOT NULL,
    "workflow_type" TEXT,
    "target_role" TEXT,
    "href" TEXT,
    "event_id" INTEGER,
    "society_application_id" INTEGER,
    "registration_id" INTEGER,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("notification_id")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'notification_recipient_admin_id_fkey'
    ) THEN
        ALTER TABLE "notification"
        ADD CONSTRAINT "notification_recipient_admin_id_fkey"
        FOREIGN KEY ("recipient_admin_id") REFERENCES "admin"("admin_id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'notification_actor_admin_id_fkey'
    ) THEN
        ALTER TABLE "notification"
        ADD CONSTRAINT "notification_actor_admin_id_fkey"
        FOREIGN KEY ("actor_admin_id") REFERENCES "admin"("admin_id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "notification_recipient_admin_id_read_at_created_at_idx"
ON "notification"("recipient_admin_id", "read_at", "created_at");

CREATE INDEX IF NOT EXISTS "notification_recipient_admin_id_created_at_idx"
ON "notification"("recipient_admin_id", "created_at");
