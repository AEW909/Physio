import { redirect } from "next/navigation";

type AppointmentDetailPageProps = {
  params: Promise<{ appointmentId: string }>;
};

export default async function AppointmentDetailPage({ params }: AppointmentDetailPageProps) {
  const { appointmentId } = await params;
  redirect(`/sessions/${appointmentId}`);
}
