import DepartmentWorkflowReviewPage from "@/components/department-workflow-review-page";

export default function DepartmentRegistrarPage() {
  return (
    <DepartmentWorkflowReviewPage
      role="Registrar"
      reviewTitle="Registrar department event review"
      approvalTitle="Registrar department event approvals"
      description="Review department event submissions after Department Head approval."
    />
  );
}
