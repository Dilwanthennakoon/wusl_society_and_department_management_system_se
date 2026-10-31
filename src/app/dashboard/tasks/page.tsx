"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/pageheader";

type Task = {
  task_id: number;
  event_id: number;
  admin_id: number;
  task_title: string;
  task_description: string | null;
  start_date: string | null;
  due_date: string | null;
  priority: string;
  task_status: string;
  created_at: string;
  event?: {
    event_name: string;
  };
  admin?: {
    admin_name: string;
  };
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function fetchTasks() {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteTask(id: number) {
    const confirmDelete = confirm("Are you sure you want to delete this task?");

    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Task deleted successfully");
        fetchTasks();
      } else {
        alert("Failed to delete task");
      }
    } catch (error) {
      console.error("Delete task error:", error);
      alert("Something went wrong");
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter((task) =>
    task.task_title.toLowerCase().includes(search.toLowerCase()),
  );

  function statusClass(status: string) {
    if (status === "Completed") return "bg-green-100 text-green-700";
    if (status === "In Progress") return "bg-blue-100 text-blue-700";
    return "bg-yellow-100 text-yellow-700";
  }

  function priorityClass(priority: string) {
    if (priority === "High") return "bg-red-100 text-red-700";
    if (priority === "Medium") return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Manage event tasks and responsibilities"
        actionLabel="Add Task"
        actionHref="/dashboard/tasks/add"
      />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-slate-900 md:w-96"
          />
        </div>

        {loading ? (
          <p className="text-gray-600">Loading tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <p className="text-gray-600">No tasks found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Task Title
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Event
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Due Date
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Priority
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTasks.map((task) => (
                  <tr
                    key={task.task_id}
                    className="border-b text-gray-900 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-900">{task.task_id}</td>

                    <td className="px-4 py-3 font-medium text-gray-900">
                      {task.task_title}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {task.event?.event_name || "-"}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${priorityClass(
                          task.priority,
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(
                          task.task_status,
                        )}`}
                      >
                        {task.task_status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/tasks/${task.task_id}`}
                          className="rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                        >
                          View
                        </Link>

                        <Link
                          href={`/dashboard/tasks/${task.task_id}/edit`}
                          className="rounded bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => deleteTask(task.task_id)}
                          className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
