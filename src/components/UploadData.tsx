// components/BookUploadForm.tsx
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

interface BookData {
  sourceId: string;
  title: string;
  author: string;
  domain: string;
  tier: number;
  content: string;
  isbn: string;
  publication_date: string;
  chapter: string;
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
  author: string;
  domain: string;
  tier: number;
  isbn: string;
  publication_date: string;
  source_name: string; // can be used as title
  tags: string[];
}

const defaultBook: BookData = {
  sourceId: "",
  title: "",
  author: "",
  domain: "",
  tier: 1,
  content: "",
  isbn: "",
  publication_date: "",
  chapter: "",
  tags: [],
};

export default function BookUploadForm() {
  const [formData, setFormData] = useState<BookData>(defaultBook);
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

  const handleChange = (field: keyof BookData, value: string) => {
    const parsedValue = field === "tier" ? parseInt(value) || 1 : value;
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

      const data: ChunkData = await response.json(); // ✅ Correto: tipado como ChunkData

      // Update form with chunk data, except chapter and content
      setFormData((prev) => ({
        ...prev,
        title: data.title || data.source_name || prev.title,
        author: data.author || prev.author,
        domain: data.domain || prev.domain,
        tier: data.tier || prev.tier,
        isbn: data.isbn || prev.isbn,
        publication_date: data.publication_date || prev.publication_date,
        tags: Array.isArray(data.tags) ? data.tags : prev.tags,
        // Keep chapter and content unchanged (or empty)
      }));

      toast.success("✅ Data loaded based on ID.");
    } catch (error) {
      console.error("Error fetching chunk:", error);
      toast.error("⚠️ Could not connect to server to fetch ID data.");
    } finally {
      setLoadingChunk(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    if (!formData.title || !formData.author || !formData.sourceId || !formData.domain) {
      toast.error("Please fill in required fields: ID, title, author, and domain.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ROUTE}/source/ingest-book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("✅ Book submitted successfully!");
        setFormData({ ...defaultBook, domain: domains.length > 0 ? domains[0].domain : "" });
      } else {
        let errorData;
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          errorData = await response.json();
        } else {
          errorData = { error: await response.text() };
        }

        if (errorData.error) {
          if (errorData.error.includes("already exists")) {
            toast.error(`⚠️ Book already exists: ${errorData.existing?.title || formData.title}`, {
              description: "The ID or ISBN is already registered in the system.",
            });
          } else {
            toast.error(`❌ Error: ${errorData.error}`);
          }
        } else {
          toast.error("❌ Failed to send: unexpected server response.");
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
    <Card>
      <CardHeader>
        <CardTitle>Submit Book or Chapter</CardTitle>
        <CardDescription>
          Enter the book details for ingestion into the moral domain.
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
              placeholder="e.g.: book_003"
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
            placeholder="e.g.: Contemporary Halakhic Problems: Medical Ethics"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Author (required)</label>
          <Input
            value={formData.author}
            onChange={(e) => handleChange("author", e.target.value)}
            placeholder="e.g.: Rabbi J. David Bleich"
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
          <label className="text-sm font-medium">Content / Summary</label>
          <Textarea
            value={formData.content}
            onChange={(e) => handleChange("content", e.target.value)}
            rows={5}
            placeholder="Describe the book or chapter content..."
          />
        </div>

        <div>
          <label className="text-sm font-medium">ISBN</label>
          <Input
            value={formData.isbn}
            onChange={(e) => handleChange("isbn", e.target.value)}
            placeholder="e.g.: 9780881257789"
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
          <label className="text-sm font-medium">Chapter (optional)</label>
          <Input
            value={formData.chapter}
            onChange={(e) => handleChange("chapter", e.target.value)}
            placeholder="e.g.: Genetic Interventions and Jewish Law"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Tags (separated by commas)
          </label>
          <Textarea
            value={formData.tags.join(", ")}
            onChange={(e) => handleTagsChange(e.target.value)}
            placeholder="halakhic-responsa, bioethics, genetics..."
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
          {isSubmitting ? "Submitting..." : "📤 Submit Book"}
        </Button>
      </CardFooter>
    </Card>
  );
}