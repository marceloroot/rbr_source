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
  content: string;
  domain_ref?: Array<{ id: string }>;
  tier: number;
  source_name: string;
  tags: string[];
}

interface EditContextFormProps {
  contextId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EditContextForm({ contextId, onSuccess, onCancel }: EditContextFormProps) {
  const [formData, setFormData] = useState<ContextData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [tagInput, setTagInput] = useState<string>("");

  // Carregar domínios
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROUTE}/source/serach-all-domain`);
        if (!response.ok) throw new Error("Failed to load domains");
        const data: Domain[] = await response.json();
        setDomains(data);
      } catch (error) {
        console.error("Error loading domains:", error);
        toast.error("⚠️ Could not load domain list.");
      } finally {
        setLoadingDomains(false);
      }
    };
    fetchDomains();
  }, []);

  // Carregar dados do contexto
  useEffect(() => {
    const fetchContext = async () => {
      if (!contextId) return;
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROUTE}/source/get-mongoose-source-by-id/${contextId}`);
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("❌ Context not found.");
          } else {
            toast.error("❌ Failed to load context data.");
          }
          return;
        }

        const data: ChunkData = await response.json();

        const contextData: ContextData = {
          sourceId: data.sourceId || "",
          title: data.title || data.source_name || "",
          tier: data.tier || 3,
          content: data.content || "",
          tags: Array.isArray(data.tags) ? data.tags : [],
          domain_ref: Array.isArray(data.domain_ref) ? data.domain_ref : [],
        };

        setFormData(contextData);
        setTagInput(contextData.tags.join(", "));
      } catch (error) {
        console.error("Error fetching context:", error);
        toast.error("⚠️ Failed to connect to server.");
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, [contextId]);

  // Sincroniza tags
  useEffect(() => {
    if (formData) {
      setTagInput(formData.tags.join(", "));
    }
  }, [formData]);

  const syncTags = () => {
    const tags = tagInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);
    setFormData((prev) => (prev ? { ...prev, tags } : null));
  };

  const handleChange = (field: keyof Omit<ContextData, "domain_ref">, value: string) => {
    const parsedValue = field === "tier" ? parseInt(value) || 3 : value;
    setFormData((prev) => (prev ? { ...prev, [field]: parsedValue } : null));
  };

  const handleDomainChange = (domainId: string, checked: boolean) => {
    if (!formData) return;

    if (checked) {
      // Adiciona domínio
      if (!formData.domain_ref.some((ref) => ref.id === domainId)) {
        setFormData({
          ...formData,
          domain_ref: [...formData.domain_ref, { id: domainId }],
        });
      }
    } else {
      // Remove domínio
      setFormData({
        ...formData,
        domain_ref: formData.domain_ref.filter((ref) => ref.id !== domainId),
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData || !contextId) return;
    if (!formData.title || !formData.sourceId || formData.domain_ref.length === 0) {
      toast.error("Please fill in required fields: ID, title, and at least one domain.");
      return;
    }

    setIsSubmitting(true);

    // Payload com apenas campos modificáveis (PATCH)
    const payload = {
      sourceId: formData.sourceId,
      title: formData.title,
      tier: formData.tier,
      content: formData.content,
      tags: formData.tags,
      domain_ref: formData.domain_ref,
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ROUTE}/source/update-context/${contextId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const jobResponse = await response.json();
        
        // Display job information
        toast.success("✅ Context update job created successfully!", {
          description: (
            <div className="mt-2 text-sm space-y-1">
              <p className="text-primary"><strong>Job ID:</strong> {jobResponse.jobId}</p>
              <p className="text-primary"><strong>Status:</strong> {jobResponse.status}</p>
              <p className="text-primary"><strong>Estimated time:</strong> {jobResponse.estimatedProcessingTime}</p>
            </div>
          ),
          duration: 8000,
        });

        if (onSuccess) onSuccess();
      } else {
        let errorData;
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          errorData = await response.json();
        } else {
          errorData = { error: await response.text() };
        }
        toast.error(`❌ Update failed: ${errorData.error || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Network error:", error);
      toast.error(`🌐 ${error.message || "Failed to connect to server."}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || loadingDomains) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!formData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Não foi possível carregar os dados do contexto.</p>
        </CardContent>
        <CardFooter>
          <Button variant="secondary" onClick={onCancel}>
            Voltar
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Context: {formData.title}</CardTitle>
        <CardDescription>
          Update the details of this ethical context to create an update job in the GoldCare system.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium">Source ID</label>
          <Input value={formData.sourceId} disabled />
        </div>

        <div>
          <label className="text-sm font-medium">Title (required)</label>
          <Input
            value={formData.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="e.g.: The Four Principles of Biomedical Ethics"
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
            rows={8}
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
            rows={3}
          />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Creating job..." : "💾 Create Update Job"}
        </Button>
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}