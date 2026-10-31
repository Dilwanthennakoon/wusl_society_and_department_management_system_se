import SocietyWorkflowReviewPage from "@/components/society-workflow-review-page";

export default function FacultyCoordinatorPage() {
  return (
    <SocietyWorkflowReviewPage
      role="Faculty Web Coordinator"
      eventTitle="Society event publishing"
      eventDescription="Perform the final review and publish approved society events."
      showPublishedEvents
    />
  );
}
