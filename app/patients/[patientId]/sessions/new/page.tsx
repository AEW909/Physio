import { redirect } from "next/navigation";

type NewSessionPageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function NewSessionPage({ params }: NewSessionPageProps) {
  const { patientId } = await params;
  redirect(`/patients/${patientId}/treatment-plans/new`);
}
