import Link from "next/link";
import PageHeader from "@/components/pageheader";
import { prisma } from "@/lib/prisma";

type DepartmentViewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DepartmentViewPage({
  params,
}: DepartmentViewPageProps) {
  const { id } = await params;

  const department = await prisma.department.findUnique({
    where: {
      department_id: Number(id),
    },
  });

  if (!department) {
    return (
      <div>
        <PageHeader
          title="Department Not Found"
          description="The selected department could not be found"
        />

        <div className="rounded-2xl bg-white/95 p-6 shadow-lg backdrop-blur-md">
          <p className="text-base text-gray-900">
            No department record was found for ID: {id}
          </p>

          <Link
            href="/dashboard/departments"
            className="mt-6 inline-block rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Departments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Department Details"
        description="View full department information"
        actionLabel="Edit Department"
        actionHref={`/dashboard/departments/${department.department_id}/edit`}
      />

      <div className="rounded-2xl bg-white/95 p-6 shadow-lg backdrop-blur-md">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Department ID</p>
            <p className="mt-1 text-base text-gray-900">
              {department.department_id}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Department Name</p>
            <p className="mt-1 text-base text-gray-900">
              {department.department_name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Department Code</p>
            <p className="mt-1 text-base text-gray-900">
              {department.department_code || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Faculty</p>
            <p className="mt-1 text-base text-gray-900">
              {department.faculty || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Status</p>
            <p className="mt-1 text-base text-gray-900">
              {department.status || "-"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Created At</p>
            <p className="mt-1 text-base text-gray-900">
              {new Date(department.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-sm text-gray-500">Description</p>

          <div className="mt-2 rounded-xl bg-gray-50 p-4 text-base text-gray-900">
            {department.description || "-"}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            href={`/dashboard/departments/${department.department_id}/edit`}
            className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
          >
            Edit Department
          </Link>

          <Link
            href="/dashboard/departments"
            className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to Departments
          </Link>
        </div>
      </div>
    </div>
  );
}
