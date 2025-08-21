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

interface ArticleData {
  sourceId: string;
  title: string;
  author: string;
  tier: number;
  content: string;
  url: string;
  publication_date: string;
  tags: string[];
  domain_ref: Array<{ id: string }>;
}

interface EditArticleFormProps {
  articleId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EditArticleForm({
  articleId,
  onSuccess,
  onCancel,
}: EditArticleFormProps) {
  const [formData, setFormData] = useState<ArticleData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
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

  // Carregar dados do artigo
  useEffect(() => {
    const fetchArticle = async () => {
      if (!articleId) return;
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROUTE}/source/get-chunk-by-id/${articleId}`);
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("❌ Article not found.");
          } else {
            toast.error("❌ Failed to load article data.");
          }
          return;
        }

        const data = await response.json();

        const articleData: ArticleData = {
          sourceId: data.sourceId || "",
          title: data.title || data.source_name || "",
          author: data.author || "",
          tier: data.tier || 2,
          content: data.content || "",
          url: data.url || "",
          publication_date: data.publication_date || "",
          tags: Array.isArray(data.tags) ? data.tags : [],
          domain_ref: Array.isArray(data.domain_ref) ? data.domain_ref : [],
        };

        setFormData(articleData);
        setTagInput(articleData.tags.join(", "));
      } catch (error) {
        console.error("Error fetching article:", error);
        toast.error("⚠️ Failed to connect to server.");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  // Sincroniza tagInput com formData.tags
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

  const handleChange = (field: keyof ArticleData, value: string) => {
    const parsedValue = field === "tier" ? parseInt(value) || 2 : value;
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
    if (!formData || !articleId) return;
    if (!formData.title || !formData.author || formData.domain_ref.length === 0) {
      toast.error("Please fill in required fields: title, author, and at least one domain.");
      return;
    }

    setIsSubmitting(true);

    // Payload com apenas campos modificáveis (PATCH)
    const payload = {
      title: formData.title,
      author: formData.author,
      tier: formData.tier,
      content: formData.content,
      url: formData.url,
      publication_date: formData.publication_date,
      tags: formData.tags,
      domain_ref: formData.domain_ref,
    };

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ROUTE}/source/update-article/${articleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("✅ Article updated successfully!");
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
          <p className="text-muted-foreground">Não foi possível carregar os dados do artigo.</p>
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
        <CardTitle>Edit Article: {formData.title}</CardTitle>
        <CardDescription>
          Update the details of this article in the GoldCare system.
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
            <p className="text-sm text-muted-foreground">Loading domains...</p>
          ) : !Array.isArray(domains) || domains.length === 0 ? (
            <p className="text-sm text-muted-foreground">No domains available.</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2">
              {domains.map((d) => {
                if (!d._additional.id) return null;
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
          <label className="text-sm font-medium">Content / Summary</label>
          <Textarea
            value={formData.content}
            onChange={(e) => handleChange("content", e.target.value)}
            rows={6}
            placeholder="Enter the article content or summary..."
          />
        </div>

        <div>
          <label className="text-sm font-medium">Article URL</label>
          <Input
            type="url"
            value={formData.url}
            onChange={(e) => handleChange("url", e.target.value)}
            placeholder="https://journalofmedicalethics.bmj.com/content/29/5/303"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Publication Date</label>
          <Input
            type="date"
            value={formData.publication_date}
            onChange={(e) => handleChange("publication_date", e.target.value)}
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
          {isSubmitting ? "Saving..." : "💾 Save Changes"}
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