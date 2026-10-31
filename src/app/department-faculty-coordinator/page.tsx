import DepartmentWorkflowReviewPage from "@/components/department-workflow-review-page";

export default function DepartmentFacultyCoordinatorPage() {
  return (
    <DepartmentWorkflowReviewPage
      role="Faculty Web Coordinator"
      reviewTitle="Final department event review"
      approvalTitle="Department event publishing"
      description="Complete the final review and publish approved department events."
      showPublishedEvents
    />
  );
}
