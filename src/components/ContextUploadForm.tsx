/* eslint-disable @typescript-eslint/no-explicit-any */
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

// === Tipos ===
interface Domain {
  _additional: { id: string };
  domain: string;
  priority: string;
  anchor_behavior: string;
}

interface ContextData {
  sourceId: string;
  title: string;
  tier: number;
  content: string;
  tags: string[];
  domain_ref: Array<{ id: string }>;
}

// Type for data returned by the chunk API
interface ChunkData {
  sourceId: string;
  title: string;
  domain: string;
  domain_ref?: Array<{ id: string }>;
  tier: number;
  source_name: string;
  tags: string[];
}

const defaultContext: ContextData = {
  sourceId: "",
  title: "",
  tier: 3,
  content: "",
  tags: [],
  domain_ref: [],
};

interface ContextUploadFormProps {
  compact?: boolean;
}

export default function ContextUploadForm({ compact = false }: ContextUploadFormProps) {
  const [formData, setFormData] = useState<ContextData>(defaultContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState<boolean>(true);
  const [loadingChunk, setLoadingChunk] = useState<boolean>(false);
  const [tagInput, setTagInput] = useState<string>("");

  // Carregar domínios
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROUTE}/source/serach-all-domain`);
        if (!response.ok) throw new Error("Failed to load domains");

        const data: Domain[] = await response.json();
        setDomains(data);

        // Define o primeiro domínio como padrão
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

  // Sincroniza tags
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

  const handleChange = (field: keyof Omit<ContextData, "domain_ref">, value: string) => {
    const parsedValue = field === "tier" ? parseInt(value) || 3 : value;
    setFormData((prev) => ({ ...prev, [field]: parsedValue }));
  };

  const handleDomainChange = (domainId: string, checked: boolean) => {
    if (checked) {
      // Adiciona
      if (!formData.domain_ref.some((ref) => ref.id === domainId)) {
        setFormData((prev) => ({
          ...prev,
          domain_ref: [...prev.domain_ref, { id: domainId }],
        }));
      }
    } else {
      // Remove
      setFormData((prev) => ({
        ...prev,
        domain_ref: prev.domain_ref.filter((ref) => ref.id !== domainId),
      }));
    }
  };

  // Carregar dados ao sair do campo ID
  const handleSourceIdBlur = async () => {
    const id = formData.sourceId.trim();
    if (!id) return;

    setLoadingChunk(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ROUTE}/source/get-last-chunk-source/${id}`);
      if (!response.ok) {
        if (response.status === 404) {
          toast.info("ℹ️ New ID. Please fill in the data manually.");
        } else {
          toast.error("❌ Failed to fetch data for this ID.");
        }
        return;
      }

      const data: ChunkData = await response.json();

      setFormData((prev) => ({
        ...prev,
        title: data.title || data.source_name || prev.title,
        tier: data.tier || prev.tier,
        tags: Array.isArray(data.tags) ? data.tags : prev.tags,
        domain_ref: Array.isArray(data.domain_ref) ? data.domain_ref : prev.domain_ref,
        // Mantém o conteúdo vazio para edição
      }));

      toast.success("✅ Context data loaded from ID.");
    } catch (error) {
      console.error("Error fetching chunk:", error);
      toast.error("⚠️ Could not connect to server to fetch ID data.");
    } finally {
      setLoadingChunk(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    if (!formData.title || !formData.sourceId || formData.domain_ref.length === 0) {
      toast.error("Please fill in required fields: ID, title, and at least one domain.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ROUTE}/source/ingest-context`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("✅ Context submitted successfully!");
        // Reset com domínio padrão
        setFormData({
          ...defaultContext,
          domain_ref: domains.length > 0 ? [{ id: domains[0]._additional.id }] : [],
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
          toast.error(`⚠️ Context already exists: ${errorData.existing?.title || formData.title}`, {
            description: "The ID is already registered in the system.",
          });
        } else {
          toast.error(`❌ Error: ${errorData.error || "Failed to submit context."}`);
        }
      }
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
        <CardTitle>Submit Ethical Context</CardTitle>
        <CardDescription>
          Enter a moral or conceptual context to enrich the AI&apos;s decision-making domain.
        </CardDescription>
      </CardHeader>
      <CardContent className={compact ? "space-y-4" : "space-y-6"}>
        <div className={compact ? "max-h-[65vh] overflow-auto pr-2" : undefined}>
          <div>
            <label className="text-sm font-medium">Source ID (required)</label>
            <div className="flex gap-2">
              <Input
                value={formData.sourceId}
                onChange={(e) => handleChange("sourceId", e.target.value)}
                onBlur={handleSourceIdBlur}
                placeholder="e.g.: context_01"
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
            <label className="text-sm font-medium">Domains (required)</label>
            {loadingDomains ? (
              <p className="text-sm text-muted-foreground">Loading domains...</p>
            ) : !Array.isArray(domains) || domains.length === 0 ? (
              <p className="text-sm text-muted-foreground">No domains available.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2">
                {domains.map((d) => {
                  if (!d._additional?.id) return null;
                  const isSelected = formData.domain_ref.some((ref) => ref.id === d._additional.id);
                  return (
                    <label
                      key={d._additional.id}
                      className="flex items-center gap-2 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleDomainChange(d._additional.id, e.target.checked)}
                        className="size-4"
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
            <label className="text-sm font-medium">Tier Level</label>
            <Input
              type="number"
              min="1"
              max="3"
              value={formData.tier}
              onChange={(e) => handleChange("tier", e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Conceptual Content</label>
            <Textarea
              value={formData.content}
              onChange={(e) => handleChange("content", e.target.value)}
              rows={compact ? 6 : 8}
              placeholder="Develop the ethical, conceptual, or philosophical context to be considered by the AI..."
            />
          </div>

          <div>
            <label className="text-sm font-medium">Tags (separated by commas)</label>
            <Textarea
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onBlur={syncTags}
              onKeyDown={(e) => e.key === "Enter" && syncTags()}
              placeholder="bioethics, principlism, autonomy..."
              rows={compact ? 2 : 3}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className={compact ? "pt-2" : undefined}>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Submitting..." : "📤 Submit Context"}
        </Button>
      </CardFooter>
    </Card>
  );
}