import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seededSocietyShortNames = ["ACISS", "AIMSS", "ESOC", "MATHSOC"];

async function main() {
  await prisma.$transaction([
    prisma.reportAttachment.deleteMany(),
    prisma.reportTask.deleteMany(),
    prisma.reporting.deleteMany(),
    prisma.taskAssignment.deleteMany(),
    prisma.task.deleteMany(),
    prisma.eventSponsor.deleteMany(),
    prisma.eventImage.deleteMany(),
    prisma.eventReview.deleteMany(),
    prisma.eventMember.deleteMany(),
    prisma.event.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.registration.deleteMany(),
    prisma.societyApplicationReview.deleteMany(),
    prisma.societyApplication.deleteMany(),
    prisma.societyContact.deleteMany(),
    prisma.societySocialMedia.deleteMany(),
    prisma.society.deleteMany({
      where: { society_short_name: { in: seededSocietyShortNames } },
    }),
    prisma.admin.deleteMany({
      where: { admin_email: { endsWith: "@example.com" } },
    }),
  ]);

  console.log("Presentation data reset completed successfully");
}

main()
  .catch((error) => {
    console.error("Presentation data reset failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
