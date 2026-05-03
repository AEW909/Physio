import { redirect } from "next/navigation";

type NewAppointmentPageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function NewAppointmentPage({ params }: NewAppointmentPageProps) {
  const { patientId } = await params;
  redirect(`/patients/${patientId}/treatment-plans/new`);
}
