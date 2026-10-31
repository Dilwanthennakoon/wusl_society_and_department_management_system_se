import WorkflowLogin from "@/components/workflow-login";

export default function SocietyLoginPage() {
  return (
    <WorkflowLogin
      section="Society Workflow"
      logo="/images/society_logo.jpg"
      accent="blue"
      roles={[
        { role: "Student", email: "student@wusl.lk", redirect: "/student-society" },
        { role: "System Admin", email: "systemadmin@wusl.lk", redirect: "/create_account" },
        { role: "Society Admin", email: "societyadmin@wusl.lk", redirect: "/society-admin" },
        { role: "Treasurer", email: "treasurer@wusl.lk", redirect: "/treasurer" },
        { role: "Registrar", email: "registrar@wusl.lk", redirect: "/registrar" },
        { role: "Student Counsellor", email: "counsellor@wusl.lk", redirect: "/student-counsellor" },
        { role: "Department Head", email: "departmenthead@wusl.lk", redirect: "/department-head" },
        { role: "Dean", email: "dean@wusl.lk", redirect: "/dean" },
        { role: "Vice-Chancellor", email: "vicechancellor@wusl.lk", redirect: "/vice-chancellor" },
        { role: "Faculty Web Coordinator", email: "webcoordinator@wusl.lk", redirect: "/faculty-coordinator" },
      ]}
    />
  );
}
