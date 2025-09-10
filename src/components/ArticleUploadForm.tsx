"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";

interface ArticleData {
  sourceId: string;
  title: string;
  author: string;
  domain_ref: Array<{ id: string }>;
  tier: number;
  content: string;
  url: string;
  publication_date: string;
  tags: string[];
}

interface Domain {
  _additional: {
    id: string;
  };
  domain: string;
  priority: string;
  anchor_behavior: string;
}

// Type for data returned by the chunk API
interface ChunkData {
  sourceId: string;
  title: string;
  author: string;
  domain: string;
  domain_ref?: Array<{ id: string }>;
  tier: number;
  url?: string;
  publication_date: string;
  source_name: string;
  tags: string[];
}

const defaultArticle: ArticleData = {
  sourceId: "",
  title: "",
  author: "",
  tier: 2,
  content: "",
  url: "",
  publication_date: "",
  tags: [],
  domain_ref: [],
};

interface ArticleUploadFormProps {
  compact?: boolean;
}

export default function ArticleUploadForm({
  compact = false,
}: ArticleUploadFormProps) {
  const [formData, setFormData] = useState<ArticleData>(defaultArticle);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState<boolean>(true);
  const [loadingChunk, setLoadingChunk] = useState<boolean>(false);
  const [tagInput, setTagInput] = useState<string>("");
  // Load domains on component mount
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_ROUTE}/source/serach-all-domain`
        );
        if (!response.ok) throw new Error("Failed to load domains");

        const data: Domain[] = await response.json();
        setDomains(data);

        if (data.length > 0 && formData.domain_ref.length === 0) {
          setFormData((prev) => ({
            ...prev,
            domain_ref: [{ id: data[0]._additional.id }],
          }));
        }
      } catch (error) {
        console.error("Error loading domains:", error);
        toast.error("⚠️ Could not load domain list.");
      } finally {
        setLoadingDomains(false);
      }
    };

    fetchDomains();
  }, []);

  const handleChange = (field: keyof ArticleData, value: string) => {
    const parsedValue = field === "tier" ? parseInt(value) || 2 : value;
    setFormData((prev) => ({ ...prev, [field]: parsedValue }));
  };

  useEffect(() => {
    setTagInput(formData.tags.join(", "));
  }, [formData.tags]);

  const syncTags = () => {
    const tags = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setFormData((prev) => ({ ...prev, tags }));
  };

  // Function triggered when leaving the sourceId field
  const handleSourceIdBlur = async () => {
    const id = formData.sourceId.trim();
    if (!id) return;

    setLoadingChunk(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ROUTE}/source/get-last-chunk-source/${id}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          toast.info("ℹ️ New ID. Please fill in the data manually.");
        } else {
          toast.error("❌ Failed to fetch data for this ID.");
        }
        return;
      }

      const data: ChunkData = await response.json();

      // Update form with chunk data, except content
      setFormData((prev) => ({
        ...prev,
        title: data.title || data.source_name || prev.title,
        author: data.author || prev.author,
        domain_ref: Array.isArray(data.domain_ref)
          ? data.domain_ref
          : prev.domain_ref,
        tier: data.tier || prev.tier,
        url: data.url || prev.url,
        publication_date: data.publication_date || prev.publication_date,
        tags: Array.isArray(data.tags) ? data.tags : prev.tags,
        // Keep content empty for editing
      }));

      toast.success("✅ Article data loaded from ID.");
    } catch (error) {
      console.error("Error fetching chunk:", error);
      toast.error("⚠️ Could not connect to server to fetch ID data.");
    } finally {
      setLoadingChunk(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    if (
      !formData.title ||
      !formData.author ||
      !formData.sourceId ||
      formData.domain_ref.length <= 0 ||
      !formData.content ||
      !formData.publication_date ||
      !formData.tags ||
      !formData.tier 
    ) {
      toast.error(
        "Please fill in required fields: ID, title, author, content, tags, tier and publication_date."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ROUTE}/source/ingest-article`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        const jobResponse = await response.json();
        
        // Display job information
        toast.success("✅ Article ingestion job created successfully!", {
          description: (
            <div className="mt-2 text-sm space-y-1">
              <p className="text-primary"><strong>Job ID:</strong> {jobResponse.jobId}</p>
              <p className="text-primary"><strong>Status:</strong> {jobResponse.status}</p>
              <p className="text-primary"><strong>Estimated time:</strong> {jobResponse.estimatedProcessingTime}</p>
            </div>
          ),
          duration: 8000,
        });

        // Reset form after successful job creation
        setFormData({
          ...defaultArticle,
          domain_ref:
            domains.length > 0 ? [{ id: domains[0]._additional.id }] : [],
        });
      } else {
        let errorData;
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          errorData = await response.json();
        } else {
          errorData = { error: await response.text() };
        }

        if (errorData.error && errorData.error.includes("already exists")) {
          toast.error(
            `⚠️ Article already exists: ${
              errorData.existing?.title || formData.title
            }`,
            {
              description: "The ID is already registered in the system.",
            }
          );
        } else {
          toast.error(
            `❌ Error: ${errorData.error || "Failed to submit article."}`
          );
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Network error:", error);
      toast.error(
        error.message
          ? `🌐 ${error.message}`
          : "❌ Failed to connect to server. Please check if the API is running."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={compact ? "shadow-none border-0" : undefined}>
      <CardHeader className={compact ? "pb-2" : undefined}>
        <CardTitle>Create Article Ingestion Job</CardTitle>
        <CardDescription>
          Enter article details to create an ingestion job for processing into the moral domain.
        </CardDescription>
      </CardHeader>
      <CardContent className={compact ? "space-y-4" : "space-y-6"}>
        <div
          className={compact ? "max-h-[65vh] overflow-auto pr-2" : undefined}
        >
          <div>
            <label className="text-sm font-medium">Source ID (required)</label>
            <div className="flex gap-2">
              <Input
                value={formData.sourceId}
                onChange={(e) => handleChange("sourceId", e.target.value)}
                onBlur={handleSourceIdBlur}
                placeholder="e.g.: article_021"
                required
                disabled={loadingChunk}
              />
              {loadingChunk && (
                <div className="flex items-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Title (required)</label>
            <Input
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g.: The Four Principles of Biomedical Ethics..."
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Author (required)</label>
            <Input
              value={formData.author}
              onChange={(e) => handleChange("author", e.target.value)}
              placeholder="e.g.: Tom L. Beauchamp and James F. Childress"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Domains (required)</label>
            {loadingDomains ? (
              <p className="text-sm text-muted-foreground">
                Loading domains...
              </p>
            ) : !Array.isArray(domains) || domains.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No domains available.
              </p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2">
                {domains.map((d) => {
                  // Garante que d.id é string e válido
                  if (!d._additional.id) {
                    console.warn("Domain without id:", d);
                    return null;
                  }

                  const isSelected = formData.domain_ref.some(
                    (ref) => ref.id === d._additional.id
                  );

                  return (
                    <label
                      key={d._additional.id}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const id = d._additional.id;
                          if (e.target.checked) {
                            // Adiciona se não existir
                            if (
                              !formData.domain_ref.some((ref) => ref.id === id)
                            ) {
                              setFormData((prev) => ({
                                ...prev,
                                domain_ref: [...prev.domain_ref, { id }],
                              }));
                            }
                          } else {
                            // Remove
                            setFormData((prev) => ({
                              ...prev,
                              domain_ref: prev.domain_ref.filter(
                                (ref) => ref.id !== id
                              ),
                            }));
                          }
                        }}
                        className="size-4"
                        required
                      />
                      <span>
                        {d.domain} ({d.priority})
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Tier Level (required)</label>
            <Input
              type="number"
              min="1"
              max="3"
              value={formData.tier}
              onChange={(e) => handleChange("tier", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Content / Summary (required)</label>
            <Textarea
              value={formData.content}
              onChange={(e) => handleChange("content", e.target.value)}
              rows={compact ? 5 : 6}
              placeholder="Enter the article content or summary..."
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Article URL (required)</label>
            <Input
              type="url"
              value={formData.url}
              onChange={(e) => handleChange("url", e.target.value)}
              placeholder="https://journalofmedicalethics.bmj.com/content/29/5/303"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Publication Date (required)</label>
            <Input
              type="date"
              value={formData.publication_date}
              onChange={(e) => handleChange("publication_date", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Tags (separated by commas) (required)
            </label>
            <Textarea
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onBlur={syncTags}
              onKeyDown={(e) => e.key === "Enter" && syncTags()}
              placeholder="halakhic-responsa, bioethics, genetics..."
              rows={compact ? 2 : 3}
              required
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className={compact ? "pt-2" : undefined}>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Creating job..." : "📤 Create Article Ingestion Job"}
        </Button>
      </CardFooter>
    </Card>
  );
}
