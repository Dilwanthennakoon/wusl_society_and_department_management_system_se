-- CreateTable
CREATE TABLE "society" (
    "society_id" SERIAL NOT NULL,
    "society_name" TEXT NOT NULL,
    "society_short_name" TEXT,
    "category" TEXT,
    "description" TEXT,
    "founded_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "society_pkey" PRIMARY KEY ("society_id")
);

-- CreateTable
CREATE TABLE "registration" (
    "registration_id" SERIAL NOT NULL,
    "society_id" INTEGER NOT NULL,
    "admin_id" INTEGER,
    "student_name" TEXT NOT NULL,
    "student_index_no" TEXT NOT NULL,
    "student_email" TEXT NOT NULL,
    "student_phone" TEXT,
    "faculty" TEXT,
    "department" TEXT,
    "academic_year" TEXT,
    "registration_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Pending',

    CONSTRAINT "registration_pkey" PRIMARY KEY ("registration_id")
);

-- CreateTable
CREATE TABLE "membership" (
    "membership_id" SERIAL NOT NULL,
    "registration_id" INTEGER NOT NULL,
    "society_id" INTEGER NOT NULL,
    "student_name" TEXT NOT NULL,
    "student_index_no" TEXT NOT NULL,
    "student_email" TEXT NOT NULL,
    "member_role" TEXT NOT NULL DEFAULT 'Member',
    "joined_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "membership_status" TEXT NOT NULL DEFAULT 'Active',

    CONSTRAINT "membership_pkey" PRIMARY KEY ("membership_id")
);

-- CreateTable
CREATE TABLE "admin" (
    "admin_id" SERIAL NOT NULL,
    "admin_name" TEXT NOT NULL,
    "admin_email" TEXT NOT NULL,
    "admin_password" TEXT NOT NULL,
    "admin_role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "event" (
    "event_id" SERIAL NOT NULL,
    "society_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "event_name" TEXT NOT NULL,
    "event_description" TEXT,
    "event_type" TEXT,
    "event_date" TIMESTAMP(3),
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "venue" TEXT,
    "event_status" TEXT NOT NULL DEFAULT 'Planned',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "event_member" (
    "event_member_id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "membership_id" INTEGER NOT NULL,
    "role_in_event" TEXT,
    "attendance_status" TEXT NOT NULL DEFAULT 'Registered',
    "joined_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_member_pkey" PRIMARY KEY ("event_member_id")
);

-- CreateTable
CREATE TABLE "task" (
    "task_id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "task_title" TEXT NOT NULL,
    "task_description" TEXT,
    "start_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "task_status" TEXT NOT NULL DEFAULT 'Pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_pkey" PRIMARY KEY ("task_id")
);

-- CreateTable
CREATE TABLE "task_assignment" (
    "task_assignment_id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "membership_id" INTEGER NOT NULL,
    "assigned_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignment_status" TEXT NOT NULL DEFAULT 'Assigned',

    CONSTRAINT "task_assignment_pkey" PRIMARY KEY ("task_assignment_id")
);

-- CreateTable
CREATE TABLE "finance" (
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

-- CreateTable
CREATE TABLE "reporting" (
    "report_id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "report_title" TEXT NOT NULL,
    "report_type" TEXT,
    "report_description" TEXT,
    "generated_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "report_status" TEXT NOT NULL DEFAULT 'Generated',

    CONSTRAINT "reporting_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "report_finance" (
    "report_finance_id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "finance_id" INTEGER NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "report_finance_pkey" PRIMARY KEY ("report_finance_id")
);

-- CreateTable
CREATE TABLE "report_task" (
    "report_task_id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "task_id" INTEGER NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "report_task_pkey" PRIMARY KEY ("report_task_id")
);

-- CreateTable
CREATE TABLE "society_contact" (
    "contact_id" SERIAL NOT NULL,
    "society_id" INTEGER NOT NULL,
    "contact_type" TEXT,
    "contact_value" TEXT,

    CONSTRAINT "society_contact_pkey" PRIMARY KEY ("contact_id")
);

-- CreateTable
CREATE TABLE "society_social_media" (
    "social_id" SERIAL NOT NULL,
    "society_id" INTEGER NOT NULL,
    "platform" TEXT,
    "link" TEXT,

    CONSTRAINT "society_social_media_pkey" PRIMARY KEY ("social_id")
);

-- CreateTable
CREATE TABLE "admin_phone" (
    "admin_phone_id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "phone_number" TEXT,

    CONSTRAINT "admin_phone_pkey" PRIMARY KEY ("admin_phone_id")
);

-- CreateTable
CREATE TABLE "event_image" (
    "image_id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "image_path" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_image_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "event_sponsor" (
    "sponsor_id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "sponsor_name" TEXT,
    "sponsor_type" TEXT,
    "amount" DECIMAL(10,2),
    "contact_no" TEXT,

    CONSTRAINT "event_sponsor_pkey" PRIMARY KEY ("sponsor_id")
);

-- CreateTable
CREATE TABLE "report_attachment" (
    "attachment_id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "file_name" TEXT,
    "file_path" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_attachment_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "membership_registration_id_key" ON "membership"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_admin_email_key" ON "admin"("admin_email");

-- AddForeignKey
ALTER TABLE "registration" ADD CONSTRAINT "registration_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("society_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration" ADD CONSTRAINT "registration_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registration"("registration_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership" ADD CONSTRAINT "membership_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("society_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("society_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_member" ADD CONSTRAINT "event_member_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_member" ADD CONSTRAINT "event_member_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "membership"("membership_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignment" ADD CONSTRAINT "task_assignment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignment" ADD CONSTRAINT "task_assignment_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "membership"("membership_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance" ADD CONSTRAINT "finance_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance" ADD CONSTRAINT "finance_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporting" ADD CONSTRAINT "reporting_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_finance" ADD CONSTRAINT "report_finance_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reporting"("report_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_finance" ADD CONSTRAINT "report_finance_finance_id_fkey" FOREIGN KEY ("finance_id") REFERENCES "finance"("finance_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_task" ADD CONSTRAINT "report_task_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reporting"("report_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_task" ADD CONSTRAINT "report_task_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("task_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "society_contact" ADD CONSTRAINT "society_contact_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("society_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "society_social_media" ADD CONSTRAINT "society_social_media_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "society"("society_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_phone" ADD CONSTRAINT "admin_phone_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_image" ADD CONSTRAINT "event_image_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sponsor" ADD CONSTRAINT "event_sponsor_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("event_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_attachment" ADD CONSTRAINT "report_attachment_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reporting"("report_id") ON DELETE RESTRICT ON UPDATE CASCADE;
