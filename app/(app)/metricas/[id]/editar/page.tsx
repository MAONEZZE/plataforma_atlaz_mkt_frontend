import { MetricasForm } from "@/components/forms/MetricasForm";

export default async function EditarMetricaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="max-w-2xl">
      <MetricasForm mode="edit" metricaId={id} />
    </div>
  );
}
