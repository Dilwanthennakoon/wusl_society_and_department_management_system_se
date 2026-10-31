import DepartmentWorkflowReviewPage from "@/components/department-workflow-review-page";

export default function DepartmentDeanPage() {
  return (
    <DepartmentWorkflowReviewPage
      role="Dean"
      reviewTitle="Dean department event review"
      approvalTitle="Dean department event approvals"
      description="Review department event submissions after Registrar approval."
    />
  );
}
