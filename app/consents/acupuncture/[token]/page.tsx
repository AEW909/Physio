import { AcupunctureConsentPublicForm } from "@/components/consents/acupuncture-consent-public-form";
import { getAcupunctureConsentByToken } from "@/lib/acupuncture-consents/queries";

type PublicAcupunctureConsentPageProps = {
  params: Promise<{ token: string }>;
};

export default async function PublicAcupunctureConsentPage({ params }: PublicAcupunctureConsentPageProps) {
  const { token } = await params;
  const consent = await getAcupunctureConsentByToken(token);
  const patientName = consent.patient
    ? `${consent.patient.first_name} ${consent.patient.last_name}`
    : consent.patient_full_name || "Patient";

  return (
    <main className="shell public-consent-shell">
      <section className="workspace">
        <AcupunctureConsentPublicForm
          alreadySubmitted={consent.status !== "generated"}
          dateOfBirth={consent.patient?.date_of_birth ?? consent.patient_date_of_birth}
          patientName={patientName}
          token={token}
        />
      </section>
    </main>
  );
}
