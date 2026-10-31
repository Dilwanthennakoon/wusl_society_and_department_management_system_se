import WorkflowLogin from "@/components/workflow-login";

export default function DepartmentLoginPage() {
  return (
    <WorkflowLogin
      section="Department Workflow"
      logo="/images/department_logo.jpg"
      accent="purple"
      roles={[
        { role: "System Admin", email: "systemadmin@wusl.lk", redirect: "/create_account" },
        { role: "Lecturer", email: "lecturer@wusl.lk", redirect: "/lecturer" },
        { role: "Department Head", email: "departmenthead@wusl.lk", redirect: "/department-event-head" },
        { role: "Registrar", email: "registrar@wusl.lk", redirect: "/department-registrar" },
        { role: "Dean", email: "dean@wusl.lk", redirect: "/department-dean" },
        { role: "Vice-Chancellor", email: "vicechancellor@wusl.lk", redirect: "/department-vice-chancellor" },
        { role: "Faculty Web Coordinator", email: "webcoordinator@wusl.lk", redirect: "/department-faculty-coordinator" },
      ]}
    />
  );
}
