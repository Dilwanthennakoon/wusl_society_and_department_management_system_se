-- Finance tracking is no longer part of the application.
DROP TABLE IF EXISTS "report_finance";
DROP TABLE IF EXISTS "finance";

UPDATE "reporting"
SET "report_type" = 'Final Report'
WHERE "report_type" = 'Finance Report';
