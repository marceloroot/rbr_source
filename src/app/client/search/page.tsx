/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BookUploadForm from "@/components/UploadData";
import ArticleUploadForm from "@/components/ArticleUploadForm";
import ContextUploadForm from "@/components/ContextUploadForm";
import SubmitForm from "@/components/SubmitForm";
import EditMoralDomainForm from "@/components/EditMoralDomainForm";
import EditBookForm from "@/components/EditBookForm";
import EditArticleForm from "@/components/EditArticleForm";
import EditContextForm from "@/components/EditContextForm";

interface Domain {
  domain: string;
  priority: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function SearchByDomainPage() {
  const [question, setQuestion] = useState(
    "What was the name of the large NIH study that involved close to 49,000 people to test whether a low-fat diet reduces the risk of heart disease or cancer?"
  );
  const [domain, setDomain] = useState("");
  const [tier, setTier] = useState(3);
  const [instructions, setInstructions] =
    useState(`1. Answer based ONLY on the provided sources above
2. Prioritize Book sources (Tier 1) over Articles (Tier 2) over Contexts
3. Maintain a life-affirming, evidence-based approach
4. If sources conflict, present both perspectives but note the tier hierarchy
5. Cite your sources using the reference codes (B1, A1, C1, etc.)`);
  const [moralFoundation, setMoralFoundation] = useState(
    "Provide life-affirming, evidence-based guidance that prioritizes human dignity and wellbeing."
  );

  const [responseRequirements, setresponseRequirements] =
  useState(`Provide a direct answer based only on the provided sources.

If the information is not found, respond simply with:
"Not enough information was found in the provided sources."

Do not add extra context, speculation, or external references.

Keep the response concise and clear.`);

  const [domains, setDomains] = useState<Domain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [result, setResult] = useState<any>(null);
  // Modal/Table state
  const [manageOpen, setManageOpen] = useState(false);
  const [chunks, setChunks] = useState<any[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [filterTypes, setFilterTypes] = useState<string[]>(["book"]);
  const [filterTiers, setFilterTiers] = useState<number[]>([1, 2]);
  const [filterPrefixes, setFilterPrefixes] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<
    "book" | "article" | "context" | "domain" | null
  >(null);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [formData, setFormData] = useState<any>({
    sourceId: "",
    title: "",
    author: "",
    type: "book",
    tier: 1,
    seq: 0,
    publication_date: "",
    isbn: "",
    content: "",
    tags: [] as string[],
  });
  const [editDomainOpen, setEditDomainOpen] = useState(false);
  const [editingDomainName, setEditingDomainName] = useState<string | null>(
    null
  );
  const [editBookOpen, setEditBookOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editArticleOpen, setEditArticleOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [editContextOpen, setEditContextOpen] = useState(false);
  const [editingContextId, setEditingContextId] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false
  });

  const apiBase = () =>
    process.env.NEXT_PUBLIC_ROUTE ?? "http://localhost:3333";

  // Keep dialog open when interacting with the toast, but allow normal outside behavior otherwise
  const keepOpenWhenClickingToast = (e: any) => {
    const target = e?.target as Node | null;
    const toaster =
      typeof document !== "undefined"
        ? document.querySelector(".toaster")
        : null;
    if (toaster && target && toaster.contains(target)) {
      e.preventDefault();
    }
  };

  // Confirm and run async action with loading inside the toast
  const confirmAsyncWithToast = (
    message: string,
    action: () => Promise<void>,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel"
  ): Promise<void> => {
    return new Promise((resolve) => {
      const ConfirmToast = ({ t }: { t: string | number }) => {
        const [loading, setLoading] = useState(false);
        return (
          <div className="bg-background border rounded-md shadow p-3 max-w-sm">
            <div className="text-sm">{message}</div>
            <div className="flex gap-2 justify-end mt-3">
              <Button
                size="sm"
                variant="secondary"
                disabled={loading}
                onClick={() => {
                  toast.dismiss(t);
                  resolve();
                }}
                className="cursor-pointer"
              >
                {cancelLabel}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={loading}
                onClick={async () => {
                  try {
                    setLoading(true);
                    await action();
                    toast.dismiss(t);
                    resolve();
                  } catch (error: any) {
                    setLoading(false);
                    toast.error(
                      error?.message ||
                        "Unexpected error while executing action."
                    );
                  }
                }}
                className="cursor-pointer"
              >
                {loading ? "Processing..." : confirmLabel}
              </Button>
            </div>
          </div>
        );
      };
      toast.custom((t) => <ConfirmToast t={t} />, { duration: Infinity });
    });
  };

  const loadChunks = async (page = 1) => {
    setLoadingChunks(true);
    try {
      const body = {
        types: filterTypes,
        tiers: filterTiers,
        sourceIdPrefixes: filterPrefixes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        page: page,
        limit: limit
      };
      const response = await fetch(
        `${apiBase()}/source/getall-filter-advanced`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      
      // Handle the new response structure with pagination
      if (data?.chunks?.data) {
        setChunks(data.chunks.data);
        if (data.chunks.pagination) {
          setPagination(data.chunks.pagination);
          setCurrentPage(data.chunks.pagination.currentPage);
        }
      } else {
        setChunks([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: false
        });
      }
    } catch (error: any) {
      toast.error(
        error?.message?.includes("Failed to fetch")
          ? "❌ Network error while loading the table."
          : `❌ ${error?.message || "Unknown error while loading the table."}`
      );
      setChunks([]);
    } finally {
      setLoadingChunks(false);
    }
  };

  useEffect(() => {
    if (manageOpen) {
      loadChunks(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manageOpen]);

  const toggleType = (t: string) => {
    setFilterTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const toggleTier = (n: number) => {
    setFilterTiers((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  };

  const resetForm = () => {
    setFormData({
      sourceId: "",
      title: "",
      author: "",
      type: "book",
      tier: 1,
      seq: 0,
      publication_date: "",
      isbn: "",
      content: "",
      tags: [] as string[],
    });
  };

  const deleteAllByPrefix = async () => {
    const prefixes = filterPrefixes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (prefixes.length === 0) {
      toast.error("Provide at least one prefix to delete.");
      return;
    }
    await confirmAsyncWithToast(
      `Delete all chunk sources for prefix(es): ${prefixes.join(
        ", "
      )}? This cannot be undone.`,
      async () => {
        setBulkDeleting(true);
        let successCount = 0;
        let errorCount = 0;
        for (const p of prefixes) {
          try {
            let response = await fetch(
              `${apiBase()}/source/delete-all-chunk-source/${encodeURIComponent(
                p
              )}`,
              { method: "DELETE" }
            );
            if (!response.ok) {
              if (response.status === 405 || response.status === 404) {
                response = await fetch(
                  `${apiBase()}/source/delete-all-chunk-source/${encodeURIComponent(
                    p
                  )}`
                );
              }
            }
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }
            successCount += 1;
          } catch (error: any) {
            errorCount += 1;
            toast.error(
              `Failed to delete by prefix '${p}': ${
                error?.message || "Unknown error"
              }`
            );
          }
        }
        toast.success(
          `Bulk delete finished. Success: ${successCount}, Errors: ${errorCount}.`
        );
        setBulkDeleting(false);
        await loadChunks(currentPage);
      },
      "Delete",
      "Cancel"
    );
  };



  const onEdit = (index: number) => {
    const item = chunks[index];
    const type = item?.type;
    console.log("chunk", item);
    // Se for um livro, abre o formulário especializado
    if (type === "book") {
      const bookId = item?._additional?.id;
      if (!bookId) {
        toast.error("Book ID not found.");
        return;
      }
      setEditingBookId(bookId);
      setEditBookOpen(true);
      return;
    }
    if (type === "article") {
      const articleId = item?._additional?.id;
      if (!articleId) {
        toast.error("Article ID not found.");
        return;
      }
      setEditingArticleId(articleId);
      setEditArticleOpen(true);
      return;
    }
    if (type === "context") {
      const contextId = item?._additional?.id;
      if (!contextId) {
        toast.error("Context ID not found.");
        return;
      }
      setEditingContextId(contextId);
      setEditContextOpen(true);
      return;
    }
    // Para outros tipos (article, context, etc.), usa o formulário genérico
    setFormData({
      sourceId: item?.sourceId || "",
      title: item?.title || "",
      author: item?.author || "",
      type,
      tier: item?.tier ?? 1,
      seq: item?.seq ?? 0,
      publication_date: item?.publication_date || "",
      isbn: item?.isbn || "",
      content: item?.content || "",
      tags: Array.isArray(item?.tags) ? item.tags : [],
    });
    setEditingIndex(index);
    setShowForm(true);
    setEditOpen(true);
  };

  const onDelete = async (index: number) => {
    const item = chunks[index];
    const id = item?._additional?.id;
    if (!id) {
      toast.error("This item has no _additional.id to delete.");
      return;
    }
    await confirmAsyncWithToast(
      `Delete item ${item?.sourceId || id}?`,
      async () => {
        setDeletingIndex(index);
        try {
          let response = await fetch(
            `${apiBase()}/source/delete-by-id-chunk-source/${encodeURIComponent(
              id
            )}`,
            { method: "DELETE" }
          );
          if (!response.ok) {
            if (response.status === 405 || response.status === 404) {
              response = await fetch(
                `${apiBase()}/source/delete-by-id-chunk-source/${encodeURIComponent(
                  id
                )}`
              );
            }
          }
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
          setChunks((prev) => prev.filter((_, i) => i !== index));
          toast.success("Item deleted successfully.");
        } catch (error: any) {
          toast.error(
            error?.message?.includes("Failed to fetch")
              ? "❌ Network error while deleting the item."
              : `❌ ${
                  error?.message || "Unknown error while deleting the item."
                }`
          );
          throw error;
        } finally {
          setDeletingIndex(null);
        }
      },
      "Delete",
      "Cancel"
    );
  };

  const onSave = () => {
    if (!formData.title || !formData.type) {
      toast.error("Title and type are required.");
      return;
    }
    if (editingIndex === null) {
      setChunks((prev) => [
        {
          ...formData,
          _additional: { id: crypto?.randomUUID?.() || String(Date.now()) },
        },
        ...prev,
      ]);
      toast.success("New item added locally.");
    } else {
      setChunks((prev) =>
        prev.map((item, i) =>
          i === editingIndex ? { ...item, ...formData } : item
        )
      );
      toast.success("Item updated locally.");
    }
    setShowForm(false);
    setEditingIndex(null);
    setEditOpen(false);
  };

  // Load available domains
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_ROUTE}/source/serach-all-domain`
        );
        if (!response.ok) throw new Error("Failed to load domains");
        const data: Domain[] = await response.json();
        setDomains(data);
        if (data.length > 0) setDomain(data[0].domain); // default
      } catch (error) {
        toast.error("⚠️ Could not load domain list.");
      } finally {
        setLoadingDomains(false);
      }
    };
    fetchDomains();
  }, []);

  const handleSearch = async () => {
    if (!question.trim() || !domain) {
      toast.error("Please fill in the question and select the domain.");
      return;
    }
    setLoadingSearch(true);
    setResult(null);
    try {
      const body = {
        question: question.trim(),
        tier,
        instructions,
        moral_foundation: moralFoundation,
        responseRequirements,
      };
      console.log("Sending body:", body);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ROUTE}/source/serach-by-domain`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      console.log("Full response:", data);
      if (!data.answer || data.answer === "") {
        toast.warning(
          "The answer came empty. Please check the submitted data."
        );
      }
      setResult(data);
      toast.success("✅ Response generated successfully!");
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error(
        error.message?.includes("Failed to fetch")
          ? "❌ Network error: Please check if the server is running."
          : `❌ ${error.message || "Unknown error"}`
      );
    } finally {
      setLoadingSearch(false);
    }
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      setCurrentPage(page);
      loadChunks(page);
    }
  };

  const goToNextPage = () => {
    if (pagination.hasNextPage) {
      goToPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (pagination.hasPrevPage) {
      goToPage(currentPage - 1);
    }
  };

  const goToFirstPage = () => {
    goToPage(1);
  };

  const goToLastPage = () => {
    goToPage(pagination.totalPages);
  };

  const getPageNumbers = () => {
    const pages = [];
    const totalPages = pagination.totalPages;
    const currentPage = pagination.currentPage;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 4) {
        pages.push('...');
      }
      
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 3) {
        pages.push('...');
      }
      
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-primary">
            🔍 Ethical Domain Search
          </h1>
          <p className="text-muted-foreground mb-8">
            Ask questions to the GoldCare AI system based on moral domains and
            structured sources. Edit instructions and moral foundation as
            needed.
          </p>
        </div>
        <div className="pt-1">
          <Button
            variant="secondary"
            onClick={() => setManageOpen(true)}
            className="cursor-pointer"
          >
            📚 Open Sources Table
          </Button>
        </div>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Configure Query</CardTitle>
            <CardDescription>
              Set the question, domain, and ethical rules for the AI.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium">Question (required)</label>
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
                placeholder="e.g.: What are the four foundational principles..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tier Level</label>
              <Input
                type="number"
                min="1"
                max="3"
                value={tier}
                onChange={(e) => setTier(parseInt(e.target.value) || 3)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Moral Foundation</label>
              <Textarea
                value={moralFoundation}
                onChange={(e) => setMoralFoundation(e.target.value)}
                rows={4}
                placeholder="e.g.: Prioritize sanctity of life and healing obligations..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">AI Instructions</label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={6}
                placeholder="1. Answer based ONLY on the provided sources above..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">AI Response Requirements</label>
              <Textarea
                value={responseRequirements}
                onChange={(e) => setresponseRequirements(e.target.value)}
                rows={6}
                placeholder="If context quality is LOW or LIMITED, begin your response by clearly stating..."
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSearch}
              disabled={loadingSearch}
              className="w-full cursor-pointer"
            >
              {loadingSearch ? "Searching..." : "🔍 Search Response"}
            </Button>
          </CardFooter>
        </Card>
        {/* Result */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>AI Response</CardTitle>
            <CardDescription>
              Result generated based on domain sources.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {result ? (
              <ScrollArea className="rounded-md border p-4 h-96 bg-secondary/20">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {result.answer}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex h-96 items-center justify-center text-muted-foreground">
                {loadingSearch ? "Processing..." : "Waiting for search..."}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 pt-0">
          {result && (
  <>
    {/* Estatísticas principais */}
    <div className="text-xs text-muted-foreground w-full grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
      <div className="flex flex-col">
        <span className="font-medium">Tier Searched</span>
        <span>{result.tiers_searched}</span>
      </div>
      <div className="flex flex-col">
        <span className="font-medium">Total Sources</span>
        <span>{result.total_sources}</span>
      </div>
      <div className="flex flex-col">
        <span className="font-medium">Relevant</span>
        <span>{result.relevant_sources}</span>
      </div>
      <div className="flex flex-col">
        <span className="font-medium">Strategy</span>
        <span className="capitalize">{result.search_strategy_used}</span>
      </div>
    </div>
    {/* Qualidade do Contexto e Resposta */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mt-2">
      {/* Qualidade do Contexto */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded text-blue-800 dark:text-blue-300">
        <h4 className="font-medium flex items-center gap-1">
          📊 Context Quality:{" "}
          <span className="ml-1 px-2 py-0.5 bg-blue-200 dark:bg-blue-800 rounded-full text-xs">
            {result.context_quality.score}/10
          </span>
        </h4>
        <p className="mt-1">{result.context_quality.reason}</p>
      </div>
      {/* Qualidade da Resposta */}
      <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded text-green-800 dark:text-green-300">
        <h4 className="font-medium flex items-center gap-1">
          ✅ Response Quality:{" "}
          <span className="ml-1 px-2 py-0.5 bg-green-200 dark:bg-green-800 rounded-full text-xs">
            {result.response_quality.score}/10
          </span>
        </h4>
        <p className="mt-1">
          Answer:{" "}
          <span className={result.response_quality.hasAnswer ? "text-green-600" : "text-red-600"}>
            {result.response_quality.hasAnswer ? "Yes" : "No"}
          </span>
          {result.response_quality.needsMoreSources && (
            <span className="block text-orange-600 mt-1">
              Needs more sources
            </span>
          )}
        </p>
      </div>
    </div>
    {/* Fontes Usadas */}
    <details className="w-full mt-3">
      <summary className="text-xs font-medium text-primary cursor-pointer hover:underline flex items-center gap-1">
        📚 View Sources Used ({result.total_sources})
      </summary>
      <div className="mt-2 p-3 bg-muted rounded text-xs max-h-60 overflow-auto space-y-3">
        {result.sources.books?.length > 0 && (
          <div>
            <strong className="text-sm">📚 Books (Tier 1)</strong>
            <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
              {result.sources.books.map((b: any) => (
                <li key={b.sourceId} className="text-xs">
                  <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">
                    B1
                  </span>{" "}
                  <strong>{b.title}</strong> ({b.sourceId}) -{" "}
                  <span className="text-muted-foreground">
                    Score: {b.relevanceScore?.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.sources.articles?.length > 0 && (
          <div>
            <strong className="text-sm">📄 Articles (Tier 2)</strong>
            <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
              {result.sources.articles.map((a: any) => (
                <li key={a.sourceId} className="text-xs">
                  <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">
                    A1
                  </span>{" "}
                  <strong>{a.title}</strong> ({a.sourceId})
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.sources.contexts?.length > 0 && (
          <div>
            <strong className="text-sm">💡 Contexts (Tier 3)</strong>
            <ul className="list-disc list-inside mt-1 ml-2 space-y-1">
              {result.sources.contexts.map((c: any) => (
                <li key={c.sourceId} className="text-xs">
                  <span className="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">
                    C1
                  </span>{" "}
                  <strong>{c.title}</strong> ({c.sourceId})
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.total_sources === 0 && (
          <p className="text-muted-foreground italic">No sources were used.</p>
        )}
      </div>
    </details>
    {/* Prompt Completo */}
    <details className="w-full">
      <summary className="text-xs font-medium text-primary cursor-pointer hover:underline flex items-center gap-1">
        📜 View Full Prompt
      </summary>
      <pre className="mt-2 p-3 bg-black text-green-400 text-xs rounded overflow-auto max-h-60 whitespace-pre-wrap">
        {result.prompt}
      </pre>
    </details>
  </>
)}
          </CardFooter>
        </Card>
      </div>
      {/* Wide dialog with Table and Actions */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent
          className="sm:max-w-7xl"
          onInteractOutside={keepOpenWhenClickingToast}
        >
          <DialogHeader>
            <DialogTitle>Manage Sources</DialogTitle>
          </DialogHeader>
          {/* Filtros */}
          <div className="p-4 border-b space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="text-sm font-medium mb-1">Types</div>
                <div className="flex items-center gap-3 text-sm">
                  {[
                    { k: "book", label: "Book" },
                    { k: "article", label: "Article" },
                    { k: "context", label: "Context" },
                  ].map((t) => (
                    <label key={t.k} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filterTypes.includes(t.k)}
                        onChange={() => toggleType(t.k)}
                        className="size-4"
                      />
                      {t.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Tiers</div>
                <div className="flex items-center gap-3 text-sm">
                  {[1, 2, 3].map((n) => (
                    <label key={n} className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filterTiers.includes(n)}
                        onChange={() => toggleTier(n)}
                        className="size-4"
                      />
                      {n}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">SourceId Prefixes</label>
                <Input
                  value={filterPrefixes}
                  onChange={(e) => setFilterPrefixes(e.target.value)}
                  placeholder="ex.: book_004,article_002"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => loadChunks(1)}
                disabled={loadingChunks}
                className="cursor-pointer"
              >
                {loadingChunks ? "Loading..." : "Apply Filters"}
              </Button>
              <div className="relative inline-block">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setNewMenuOpen((o) => !o)}
                  className="cursor-pointer"
                >
                  ➕ New
                </Button>
                {newMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-md border bg-background shadow z-[100001]">
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setCreateType("book");
                        setCreateOpen(true);
                        setNewMenuOpen(false);
                      }}
                    >
                      New Book
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setCreateType("article");
                        setCreateOpen(true);
                        setNewMenuOpen(false);
                      }}
                    >
                      New Article
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setCreateType("context");
                        setCreateOpen(true);
                        setNewMenuOpen(false);
                      }}
                    >
                      New Context
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        setCreateType("domain");
                        setCreateOpen(true);
                        setNewMenuOpen(false);
                      }}
                    >
                      New Domain
                    </button>
                    <button
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted border-t"
                      onClick={() => {
                        if (domains.length > 0) {
                          setEditingDomainName(domains[0].domain);
                        } else {
                          toast.error("No domains available to edit.");
                        }
                        setEditDomainOpen(true);
                        setNewMenuOpen(false);
                      }}
                    >
                      Edit Domain
                    </button>
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={deleteAllByPrefix}
                disabled={bulkDeleting || loadingChunks}
                className="cursor-pointer"
              >
                {bulkDeleting ? "Deleting by Prefix..." : "Delete by Prefix"}
              </Button>
            </div>
          </div>
          {/* Create Dialog (Book/Article/Context) */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent
              className="sm:max-w-4xl max-h-[90vh] h-[90vh] overflow-hidden flex flex-col"
              onInteractOutside={keepOpenWhenClickingToast}
            >
              <DialogHeader>
                <DialogTitle>
                  {createType === "book"
                    ? "New Book"
                    : createType === "article"
                    ? "New Article"
                    : createType === "context"
                    ? "New Context"
                    : "Create"}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden p-0 px-4 pb-4">
                <ScrollArea className="h-full rounded-md border p-4 bg-background">
                  {createType === "book" && <BookUploadForm compact />}
                  {createType === "article" && <ArticleUploadForm compact />}
                  {createType === "context" && <ContextUploadForm compact />}
                  {createType === "domain" && <SubmitForm />}
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
          {/* Dialog para Editar Domínio */}
          <Dialog open={editDomainOpen} onOpenChange={setEditDomainOpen}>
            <DialogContent
              className="sm:max-w-4xl max-h-[90vh] h-[90vh] overflow-hidden flex flex-col"
              onInteractOutside={keepOpenWhenClickingToast}
            >
              <DialogHeader>
                <DialogTitle>Edit Moral Domain</DialogTitle>
                <div>
                  <label className="text-sm font-medium">
                    Domain (required)
                  </label>
                  {loadingDomains ? (
                    <p className="text-sm text-muted-foreground">
                      Loading domains...
                    </p>
                  ) : (
                    <select
                      value={editingDomainName || domain}
                      onChange={(e) => {
                        const selectedDomain = e.target.value;
                        setDomain(selectedDomain); // Atualiza o estado global de domínio
                        setEditingDomainName(selectedDomain); // Atualiza o domínio sendo editado
                      }}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {domains.map((d) => (
                        <option key={d.domain} value={d.domain}>
                          {d.domain} ({d.priority})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </DialogHeader>
              <div className="flex-1 overflow-hidden p-0 px-4 pb-4">
                {editingDomainName ? (
                  <ScrollArea className="h-full rounded-md border p-4 bg-background">
                    {/* Aqui você usa o componente EditMoralDomainForm */}
                    <EditMoralDomainForm
                      domainName={editingDomainName}
                      onSuccess={() => {
                        toast.success("Domain updated successfully!");
                        setEditDomainOpen(false);
                      }}
                      onCancel={() => setEditDomainOpen(false)}
                    />
                  </ScrollArea>
                ) : (
                  <p className="p-4 text-muted-foreground">
                    No domain selected.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          {/* Dialog para Editar Livro */}
          <Dialog open={editBookOpen} onOpenChange={setEditBookOpen}>
            <DialogContent
              className="sm:max-w-4xl max-h-[90vh] h-[90vh] overflow-hidden flex flex-col"
              onInteractOutside={keepOpenWhenClickingToast}
            >
              <DialogHeader>
                <DialogTitle>Edit Book</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden p-0 px-4 pb-4">
                {editingBookId ? (
                  <ScrollArea className="h-full rounded-md border p-4 bg-background">
                    <EditBookForm
                      bookId={editingBookId}
                      onSuccess={() => {
                        toast.success("📚 Book updated successfully!");
                        setEditBookOpen(false);
                        loadChunks(currentPage); // Atualiza a tabela
                      }}
                      onCancel={() => setEditBookOpen(false)}
                    />
                  </ScrollArea>
                ) : (
                  <p className="p-4 text-muted-foreground">
                    Loading book data...
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          {/* Dialog para Editar article */}
          <Dialog open={editArticleOpen} onOpenChange={setEditArticleOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Edit Article</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden p-0 px-4 pb-4">
                {editingArticleId ? (
                  <ScrollArea className="h-full rounded-md border p-4 bg-background">
                    <EditArticleForm
                      articleId={editingArticleId}
                      onSuccess={() => {
                        toast.success("Article updated!");
                        setEditArticleOpen(false);
                        loadChunks(currentPage); // Atualiza tabela
                      }}
                      onCancel={() => setEditArticleOpen(false)}
                    />
                  </ScrollArea>
                ) : (
                  <p>Loading...</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          {/* Dialog para Editar Context */}
          <Dialog open={editContextOpen} onOpenChange={setEditContextOpen}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Edit Context</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden p-0 px-4 pb-4">
                {editingContextId ? (
                  <ScrollArea className="h-full rounded-md border p-4 bg-background">
                    <EditContextForm
                      contextId={editingContextId}
                      onSuccess={() => {
                        toast.success("Context updated!");
                        setEditContextOpen(false);
                        loadChunks(currentPage); // Atualiza tabela
                      }}
                      onCancel={() => setEditContextOpen(false)}
                    />
                  </ScrollArea>
                ) : (
                  <p>Loading...</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          {/* Tabela */}
          <div className="p-0">
            <ScrollArea className="h-[60vh]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-background">
                  <tr className="border-b text-left">
                    <th className="px-4 py-3">SourceId</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Author</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Seq</th>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">ISBN</th>
                    <th className="px-4 py-3">Domains</th>
                    <th className="px-4 py-3">Tags</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingChunks ? (
                    <tr>
                      <td className="px-4 py-6 text-center" colSpan={11}>
                        Loading...
                      </td>
                    </tr>
                  ) : chunks.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-10 text-center text-muted-foreground"
                        colSpan={11}
                      >
                        No data.
                      </td>
                    </tr>
                  ) : (
                    chunks.map((c: any, idx: number) => (
                      <tr
                        key={c?.sourceId || idx}
                        className="border-b align-top"
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {c?.sourceId}
                        </td>
                        <td className="px-4 py-3">{c?.title}</td>
                        <td className="px-4 py-3">{c?.author}</td>
                        <td className="px-4 py-3">{c?.type}</td>
                        <td className="px-4 py-3">{c?.tier}</td>
                        <td className="px-4 py-3">{c?.seq}</td>
                        <td className="px-4 py-3">
                          {c?.publication_date
                            ? String(c.publication_date).slice(0, 10)
                            : ""}
                        </td>
                        <td className="px-4 py-3">{c?.isbn}</td>
                        <td className="px-4 py-3">
                          {Array.isArray(c?.domain_ref)
                            ? c.domain_ref.map((d: any) => d?.domain).join(", ")
                            : ""}
                        </td>
                        <td className="px-4 py-3">
                          {Array.isArray(c?.tags) ? c.tags.join(", ") : ""}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onEdit(idx)}
                              className="cursor-pointer"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onDelete(idx)}
                              disabled={deletingIndex === idx}
                              className="cursor-pointer"
                            >
                              {deletingIndex === idx ? "Deleting..." : "Delete"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </div>
          
          {/* Pagination Controls */}
          {!loadingChunks && chunks.length > 0 && (
            <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {chunks.length} of {pagination.totalItems} items
                {' • '}
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={goToFirstPage}
                  disabled={!pagination.hasPrevPage || loadingChunks}
                  className="h-8 px-2"
                >
                  «
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={goToPreviousPage}
                  disabled={!pagination.hasPrevPage || loadingChunks}
                  className="h-8 px-2"
                >
                  ‹
                </Button>
                
                {getPageNumbers().map((pageNum, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={pageNum === currentPage ? "default" : "outline"}
                    onClick={() => typeof pageNum === 'number' && goToPage(pageNum)}
                    disabled={typeof pageNum !== 'number' || loadingChunks}
                    className={`h-8 w-8 ${typeof pageNum !== 'number' ? 'cursor-default' : ''}`}
                  >
                    {pageNum}
                  </Button>
                ))}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={goToNextPage}
                  disabled={!pagination.hasNextPage || loadingChunks}
                  className="h-8 px-2"
                >
                  ›
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={goToLastPage}
                  disabled={!pagination.hasNextPage || loadingChunks}
                  className="h-8 px-2"
                >
                  »
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}