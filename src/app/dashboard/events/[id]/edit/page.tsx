"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/pageheader";

type Society = {
  society_id: number;
  society_name: string;
  society_short_name: string | null;
};

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    society_id: "",
    admin_id: "1",
    event_name: "",
    event_description: "",
    event_type: "",
    event_date: "",
    start_time: "",
    end_time: "",
    venue: "",
    event_status: "Planned",
  });

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 outline-none focus:border-slate-900";

  function dateOnly(value: string | null) {
    if (!value) return "";
    return value.split("T")[0];
  }

  function timeOnly(value: string | null) {
    if (!value) return "";
    const date = new Date(value);
    return date.toTimeString().slice(0, 5);
  }

  function buildDateTime(date: string, time: string) {
    if (!date || !time) return null;
    return `${date}T${time}:00`;
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [societyRes, eventRes] = await Promise.all([
          fetch("/api/societies"),
          fetch(`/api/events/${id}`),
        ]);

        const societyData = await societyRes.json();
        const eventData = await eventRes.json();

        setSocieties(societyData);

        setFormData({
          society_id: String(eventData.society_id || ""),
          admin_id: String(eventData.admin_id || "1"),
          event_name: eventData.event_name || "",
          event_description: eventData.event_description || "",
          event_type: eventData.event_type || "",
          event_date: dateOnly(eventData.event_date),
          start_time: timeOnly(eventData.start_time),
          end_time: timeOnly(eventData.end_time),
          venue: eventData.venue || "",
          event_status: eventData.event_status || "Planned",
        });
      } catch (error) {
        console.error("Load event data error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const body = {
        society_id: Number(formData.society_id),
        admin_id: Number(formData.admin_id),
        event_name: formData.event_name,
        event_description: formData.event_description,
        event_type: formData.event_type,
        event_date: formData.event_date,
        start_time: buildDateTime(formData.event_date, formData.start_time),
        end_time: buildDateTime(formData.event_date, formData.end_time),
        venue: formData.venue,
        event_status: formData.event_status,
      };

      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        alert("Event updated successfully");
        router.push("/dashboard/events");
      } else {
        alert("Failed to update event");
      }
    } catch (error) {
      console.error("Update event error:", error);
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Edit Event" description="Loading event data" />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Edit Event"
        description="Update society event details"
      />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Society
            </label>
            <select
              name="society_id"
              value={formData.society_id}
              onChange={handleChange}
              required
              className={inputClass}
            >
              <option value="">Select society</option>
              {societies.map((society) => (
                <option key={society.society_id} value={society.society_id}>
                  {society.society_short_name
                    ? `${society.society_short_name} - ${society.society_name}`
                    : society.society_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Admin ID
            </label>
            <input
              type="number"
              name="admin_id"
              value={formData.admin_id}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Event Name
            </label>
            <input
              type="text"
              name="event_name"
              value={formData.event_name}
              onChange={handleChange}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Event Type
            </label>
            <input
              type="text"
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Event Date
            </label>
            <input
              type="date"
              name="event_date"
              value={formData.event_date}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Venue
            </label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Start Time
            </label>
            <input
              type="time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              End Time
            </label>
            <input
              type="time"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="event_status"
              value={formData.event_status}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="Planned">Planned</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="event_description"
              value={formData.event_description}
              onChange={handleChange}
              rows={4}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {saving ? "Updating..." : "Update Event"}
            </button>

            <Link
              href="/dashboard/events"
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
