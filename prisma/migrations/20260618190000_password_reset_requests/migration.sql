CREATE TABLE IF NOT EXISTS "password_reset_request" (
    "reset_id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "password_reset_request_pkey" PRIMARY KEY ("reset_id")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'password_reset_request_admin_id_fkey'
    ) THEN
        ALTER TABLE "password_reset_request"
        ADD CONSTRAINT "password_reset_request_admin_id_fkey"
        FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
