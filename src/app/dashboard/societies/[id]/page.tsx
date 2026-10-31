"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/pageheader";

type Society = {
  society_id: number;
  society_name: string;
  society_short_name: string | null;
  category: string | null;
  description: string | null;
  founded_date: string | null;
  status: string;
  created_at: string;
};

export default function SocietyDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [society, setSociety] = useState<Society | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSociety() {
      try {
        const res = await fetch(`/api/societies/${id}`);
        const data = await res.json();
        setSociety(data);
      } catch (error) {
        console.error("Fetch society error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSociety();
  }, [id]);

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Society Details"
          description="Loading society details"
        />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!society) {
    return (
      <div>
        <PageHeader title="Society Details" description="Society not found" />
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <p className="text-gray-500">Society not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Society Details"
        description="View full society information"
        actionLabel="Edit Society"
        actionHref={`/dashboard/societies/${society.society_id}/edit`}
      />

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <DetailItem label="Society ID" value={society.society_id} />
          <DetailItem label="Society Name" value={society.society_name} />
          <DetailItem
            label="Short Name"
            value={society.society_short_name || "-"}
          />
          <DetailItem label="Category" value={society.category || "-"} />
          <DetailItem label="Status" value={society.status} />
          <DetailItem
            label="Founded Date"
            value={
              society.founded_date
                ? new Date(society.founded_date).toLocaleDateString()
                : "-"
            }
          />
          <DetailItem
            label="Created At"
            value={new Date(society.created_at).toLocaleString()}
          />

          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-500">Description</p>
            <p className="mt-1 rounded-lg bg-gray-50 p-4 text-gray-900">
              {society.description || "No description available."}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/dashboard/societies"
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Back to Societies
          </Link>
        </div>
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
