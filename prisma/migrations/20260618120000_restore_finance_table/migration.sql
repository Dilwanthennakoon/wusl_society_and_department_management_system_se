-- Repair databases where the original migration is recorded but the finance
-- table was removed or never created. Existing finance data is left untouched.
CREATE TABLE IF NOT EXISTS "finance" (
    "finance_id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" TEXT,
    "description" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Recorded',

    CONSTRAINT "finance_pkey" PRIMARY KEY ("finance_id")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'finance_task_id_fkey'
    ) THEN
        ALTER TABLE "finance"
        ADD CONSTRAINT "finance_task_id_fkey"
        FOREIGN KEY ("task_id") REFERENCES "task"("task_id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'finance_admin_id_fkey'
    ) THEN
        ALTER TABLE "finance"
        ADD CONSTRAINT "finance_admin_id_fkey"
        FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;

DO $$
BEGIN
    IF to_regclass('public.report_finance') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM pg_constraint
           WHERE conname = 'report_finance_finance_id_fkey'
       ) THEN
        ALTER TABLE "report_finance"
        ADD CONSTRAINT "report_finance_finance_id_fkey"
        FOREIGN KEY ("finance_id") REFERENCES "finance"("finance_id")
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;
