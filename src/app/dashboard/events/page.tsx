"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/pageheader";

type Event = {
  event_id: number;
  society_id: number;
  admin_id: number;
  event_name: string;
  event_description: string | null;
  event_type: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  event_status: string;
  created_at: string;
  society?: {
    society_name: string;
    society_short_name: string | null;
  };
  admin?: {
    admin_name: string;
  };
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function fetchEvents() {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteEvent(id: number) {
    const confirmDelete = confirm(
      "Are you sure you want to delete this event?",
    );

    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Event deleted successfully");
        fetchEvents();
      } else {
        alert("Failed to delete event");
      }
    } catch (error) {
      console.error("Delete event error:", error);
      alert("Something went wrong");
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) =>
    event.event_name.toLowerCase().includes(search.toLowerCase()),
  );

  function statusClass(status: string) {
    if (status === "Completed") return "bg-green-100 text-green-700";
    if (status === "Cancelled") return "bg-red-100 text-red-700";
    if (status === "Ongoing") return "bg-blue-100 text-blue-700";
    return "bg-yellow-100 text-yellow-700";
  }

  return (
    <div>
      <PageHeader
        title="Events"
        description="Manage society events"
        actionLabel="Add Event"
        actionHref="/dashboard/events/add"
      />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-slate-900 md:w-96"
          />
        </div>

        {loading ? (
          <p className="text-gray-600">Loading events...</p>
        ) : filteredEvents.length === 0 ? (
          <p className="text-gray-600">No events found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-3 font-semibold text-gray-700">ID</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Event Name
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Society
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Type
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Venue
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
                {filteredEvents.map((event) => (
                  <tr
                    key={event.event_id}
                    className="border-b text-gray-900 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-900">
                      {event.event_id}
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-900">
                      {event.event_name}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {event.society?.society_short_name ||
                        event.society?.society_name ||
                        "-"}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {event.event_type || "-"}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {event.event_date
                        ? new Date(event.event_date).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="px-4 py-3 text-gray-900">
                      {event.venue || "-"}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(
                          event.event_status,
                        )}`}
                      >
                        {event.event_status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/events/${event.event_id}`}
                          className="rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                        >
                          View
                        </Link>

                        <Link
                          href={`/dashboard/events/${event.event_id}/edit`}
                          className="rounded bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => deleteEvent(event.event_id)}
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
