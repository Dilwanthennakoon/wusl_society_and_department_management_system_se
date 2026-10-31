import DepartmentWorkflowReviewPage from "@/components/department-workflow-review-page";

export default function DepartmentEventHeadPage() {
  return (
    <DepartmentWorkflowReviewPage
      role="Department Head"
      reviewTitle="Department event review"
      approvalTitle="Department event approvals"
      description="Review lecturer submissions and forward approved events to the Registrar."
    />
  );
}
