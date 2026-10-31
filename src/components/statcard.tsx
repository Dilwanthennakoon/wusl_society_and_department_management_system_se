type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
};

export default function StatCard({ title, value, description }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white/95 p-6 shadow-lg backdrop-blur-md transition hover:-translate-y-1 hover:shadow-xl">
      <p className="text-sm font-medium text-gray-500">{title}</p>

      <h3 className="mt-2 text-3xl font-bold text-gray-900">{value}</h3>

      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}
