import BookUploadForm from "@/components/UploadData";

export default function UploadBookPage() {
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6 text-primary">Book Ingestion</h1>
      <p className="text-muted-foreground mb-6">
        Fill in the book or chapter details to register it in the GoldCare AI system.
      </p>
      <BookUploadForm />
    </div>
  );
}