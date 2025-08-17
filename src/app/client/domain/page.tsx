import SubmitForm from "@/components/SubmitForm";


export default function IngestMoralDomainPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-primary">
        Ingestão de Domínio
      </h1>
      <p className="text-muted-foreground mb-8 text-center">
        Preencha e envie o domínio moral para o sistema GoldCare AI.
      </p>

      <SubmitForm />
    </div>
  );
}