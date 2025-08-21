import ContextUploadForm from "@/components/ContextUploadForm";


export default function UploadContextPage() {
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6 text-primary">Context Ingestion</h1>
      <p className="text-muted-foreground mb-6">
        Submit a moral, philosophical, or conceptual context to enrich GoldCare AI&apos;s decision-making foundation.
      </p>
      <ContextUploadForm />
    </div>
  );
}