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

interface ContextData {
  sourceId: string;
  title: string;
  domain: string;
  tier: number;
  content: string;
  tags: string[];
}

interface Domain {
  domain: string;
  priority: string;
  anchor_behavior: string;
}

// Type for data returned by the chunk API
interface ChunkData {
  sourceId: string;
  title: string;
  domain: string;
  tier: number;
  source_name: string;
  tags: string[];
}

const defaultContext: ContextData = {
  sourceId: "",
  title: "",
  domain: "",
  tier: 3,
  content: "",
  tags: [],
};

export default function ContextUploadForm() {
  const [formData, setFormData] = useState<ContextData>(defaultContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState<boolean>(true);
  const [loadingChunk, setLoadingChunk] = useState<boolean>(false);

  // Load domains on component mount
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROUTE}/source/serach-all-domain`);
        if (!response.ok) throw new Error("Failed to load domains");

        const data: Domain[] = await response.json();
        setDomains(data);

        if (data.length > 0 && !formData.domain) {
          setFormData((prev) => ({ ...prev, domain: data[0].domain }));
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

  const handleChange = (field: keyof ContextData, value: string) => {
    const parsedValue = field === "tier" ? parseInt(value) || 3 : value;
    setFormData((prev) => ({ ...prev, [field]: parsedValue }));
  };

  const handleTagsChange = (value: string) => {
    const tags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    setFormData((prev) => ({ ...prev, tags }));
  };

  // Function triggered when leaving the sourceId field
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

      // Update form with chunk data, except content
      setFormData((prev) => ({
        ...prev,
        title: data.title || data.source_name || prev.title,
        domain: data.domain || prev.domain,
        tier: data.tier || prev.tier,
        tags: Array.isArray(data.tags) ? data.tags : prev.tags,
        // Keep content empty for editing
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

    if (!formData.title || !formData.sourceId || !formData.domain) {
      toast.error("Please fill in required fields: ID, title, and domain.");
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
        // Reset with default domain
        setFormData({ ...defaultContext, domain: domains.length > 0 ? domains[0].domain : "" });
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
    <Card>
      <CardHeader>
        <CardTitle>Submit Ethical Context</CardTitle>
        <CardDescription>
          Enter a moral or conceptual context to enrich the AI&apos;s decision-making domain.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
          <label className="text-sm font-medium">Domain (required)</label>
          {loadingDomains ? (
            <p className="text-sm text-muted-foreground">Loading domains...</p>
          ) : (
            <select
              value={formData.domain}
              onChange={(e) => handleChange("domain", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              {domains.length === 0 ? (
                <option>No domain available</option>
              ) : (
                domains.map((d) => (
                  <option key={d.domain} value={d.domain}>
                    {d.domain} ({d.priority})
                  </option>
                ))
              )}
            </select>
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
          <label className="text-sm font-medium">
            Tags (separated by commas)
          </label>
          <Textarea
            value={formData.tags.join(", ")}
            onChange={(e) => handleTagsChange(e.target.value)}
            placeholder="bioethics, principlism, autonomy, justice, beneficence..."
            rows={2}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "📤 Submit Context"}
        </Button>
      </CardFooter>
    </Card>
  );
}