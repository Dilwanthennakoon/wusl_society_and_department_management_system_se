"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
    category: string | null;
  };
  admin?: {
    admin_name: string;
    admin_email: string;
  };
  tasks?: {
    task_id: number;
    task_title: string;
    priority: string;
    task_status: string;
  }[];
};

export default function EventDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${id}`);
        const data = await res.json();
        setEvent(data);
      } catch (error) {
        console.error("Fetch event error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [id]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Event Details" description="Loading event details" />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div>
        <PageHeader title="Event Details" description="Event not found" />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">Event not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Event Details"
        description="View full society event information"
        actionLabel="Edit Event"
        actionHref={`/dashboard/events/${event.event_id}/edit`}
      />

      <div className="space-y-6">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Basic Information
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <DetailItem label="Event ID" value={event.event_id} />
            <DetailItem label="Event Name" value={event.event_name} />
            <DetailItem label="Event Type" value={event.event_type || "-"} />
            <DetailItem label="Venue" value={event.venue || "-"} />
            <DetailItem label="Status" value={event.event_status} />
            <DetailItem
              label="Event Date"
              value={
                event.event_date
                  ? new Date(event.event_date).toLocaleDateString()
                  : "-"
              }
            />
            <DetailItem
              label="Start Time"
              value={
                event.start_time
                  ? new Date(event.start_time).toLocaleTimeString()
                  : "-"
              }
            />
            <DetailItem
              label="End Time"
              value={
                event.end_time
                  ? new Date(event.end_time).toLocaleTimeString()
                  : "-"
              }
            />
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-gray-500">Description</p>
            <p className="mt-1 rounded-lg bg-gray-50 p-4 text-gray-900">
              {event.event_description || "No description available."}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Society and Admin
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <DetailItem
              label="Society"
              value={
                event.society?.society_short_name ||
                event.society?.society_name ||
                "-"
              }
            />
            <DetailItem
              label="Society Category"
              value={event.society?.category || "-"}
            />
            <DetailItem label="Admin" value={event.admin?.admin_name || "-"} />
            <DetailItem
              label="Admin Email"
              value={event.admin?.admin_email || "-"}
            />
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Related Tasks
          </h2>

          {event.tasks && event.tasks.length > 0 ? (
            <div className="space-y-3">
              {event.tasks.map((task) => (
                <div
                  key={task.task_id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <p className="font-medium text-gray-900">{task.task_title}</p>
                  <p className="text-sm text-gray-600">
                    Priority: {task.priority} | Status: {task.task_status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">
              No tasks created for this event yet.
            </p>
          )}
        </div>

        <Link
          href="/dashboard/events"
          className="inline-block rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Back to Events
        </Link>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 font-semibold text-gray-900">{value}</p>
    </div>
  );
}
