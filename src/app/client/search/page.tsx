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

interface Domain {
  domain: string;
  priority: string;
}

export default function SearchByDomainPage() {
  const [question, setQuestion] = useState(
    "What are the four foundational principles of biomedical ethics discussed in the article?"
  );
  const [domain, setDomain] = useState("");
  const [tier, setTier] = useState(3);
  const [instructions, setInstructions] = useState(`1. Answer based ONLY on the provided sources above
2. Prioritize Book sources (Tier 1) over Articles (Tier 2) over Contexts
3. Maintain a life-affirming, evidence-based approach
4. If sources conflict, present both perspectives but note the tier hierarchy
5. Cite your sources using the reference codes (B1, A1, C1, etc.)`);
  const [moralFoundation, setMoralFoundation] = useState(
    "Provide life-affirming, evidence-based guidance that prioritizes human dignity and wellbeing."
  );

  const [domains, setDomains] = useState<Domain[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Load available domains
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROUTE}/source/serach-all-domain`);
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
        domain,
        tier,
        instructions,
        moral_foundation: moralFoundation,
      };

      console.log("Sending body:", body);

      const response = await fetch(`${process.env.NEXT_PUBLIC_ROUTE}/source/serach-by-domain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Full response:", data);

      if (!data.answer || data.answer === "") {
        toast.warning("The answer came empty. Please check the submitted data.");
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

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-2 text-primary">🔍 Ethical Domain Search</h1>
      <p className="text-muted-foreground mb-8">
        Ask questions to the GoldCare AI system based on moral domains and structured sources. Edit instructions and moral foundation as needed.
      </p>

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
              <label className="text-sm font-medium">Domain (required)</label>
              {loadingDomains ? (
                <p className="text-sm text-muted-foreground">Loading domains...</p>
              ) : (
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
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
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSearch}
              disabled={loadingSearch}
              className="w-full"
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
                <div className="text-xs text-muted-foreground w-full">
                  <strong>Tier searched:</strong> {result.tiers_searched} |{" "}
                  <strong>Total sources:</strong> {result.total_sources} |{" "}
                  <strong>Domain:</strong> {result.domain}
                </div>

                <details className="w-full">
                  <summary className="text-xs font-medium text-primary cursor-pointer hover:underline">
                    ▼ View sources used
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded text-xs max-h-40 overflow-auto">
                    <strong>Books (Tier 1):</strong>
                    <ul className="list-disc list-inside mt-1 mb-3">
                      {result.sources.books?.map((b: any) => (
                        <li key={b.sourceId}>
                          [{b.sourceId}] {b.title}
                        </li>
                      ))}
                    </ul>
                    <strong>Articles:</strong>
                    <ul className="list-disc list-inside mt-1 mb-3">
                      {result.sources.articles?.length === 0 ? (
                        <li>None</li>
                      ) : (
                        result.sources.articles?.map((a: any) => (
                          <li key={a.sourceId}>
                            [{a.sourceId}] {a.title}
                          </li>
                        ))
                      )}
                    </ul>
                    <strong>Contexts:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {result.sources.contexts?.map((c: any) => (
                        <li key={c.sourceId}>
                          [{c.sourceId}] {c.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                </details>

                <details className="w-full">
                  <summary className="text-xs font-medium text-primary cursor-pointer hover:underline">
                    ▼ View full prompt
                  </summary>
                  <pre className="mt-2 p-3 bg-black text-green-400 text-xs rounded overflow-auto max-h-60">
                    {result.prompt}
                  </pre>
                </details>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}