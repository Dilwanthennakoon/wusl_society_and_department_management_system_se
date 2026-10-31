"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/pageheader";

type Society = {
  society_id: number;
  society_name: string;
  society_short_name: string | null;
};

export default function AddEventPage() {
  const router = useRouter();

  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    async function fetchSocieties() {
      try {
        const res = await fetch("/api/societies");
        const data = await res.json();
        setSocieties(data);
      } catch (error) {
        console.error("Fetch societies error:", error);
      }
    }

    fetchSocieties();
  }, []);

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

  function buildDateTime(date: string, time: string) {
    if (!date || !time) return null;
    return `${date}T${time}:00`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

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

      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        alert("Event added successfully");
        router.push("/dashboard/events");
      } else {
        alert("Failed to add event. Check admin_id and society_id.");
      }
    } catch (error) {
      console.error("Add event error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="Add Event" description="Create a new society event" />

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
              placeholder="Hackathon 2026"
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
              placeholder="Workshop / Competition / Meeting"
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
              placeholder="Main Auditorium"
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
              placeholder="Write event description"
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Event"}
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
