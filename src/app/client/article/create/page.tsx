import ArticleUploadForm from "@/components/ArticleUploadForm";

export default function UploadArticlePage() {
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6 text-primary">Article Ingestion</h1>
      <p className="text-muted-foreground mb-6">
        Fill in the article details to register it in the GoldCare AI system.
      </p>
      <ArticleUploadForm />
    </div>
  );
}