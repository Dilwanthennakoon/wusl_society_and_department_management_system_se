import Link from "next/link";

type PageHeaderProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
};

export default function PageHeader({
  title,
  description,
  actionLabel,
  actionHref,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl bg-white/95 p-6 shadow-lg backdrop-blur-md md:flex-row md:items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="rounded-xl bg-gradient-to-r from-blue-950 to-cyan-700 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
