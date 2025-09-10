/* eslint-disable @typescript-eslint/no-explicit-any */
// components/EditMoralDomainForm.tsx
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

// Type for the data
interface MoralDomainData {
  domain: string;
  priority: string;
  anchor_behavior: string;
  override_policy: string;
  binding: string;
  bound_to: string;
  moral_inheritance_policy: string;
  tier_1_sources: string[];
  tier_2_sources: string[];
  tier_3_sources: string[];
  clinical_reference_rationale: string;
  _additional:{id:string}
}

interface EditMoralDomainFormProps {
  domainName: string;
  onSuccess?: () => void; // Optional callback after success
  onCancel?: () => void;
}

export default function EditMoralDomainForm({
  domainName,
  onSuccess,
  onCancel,
}: EditMoralDomainFormProps) {
  const [formData, setFormData] = useState<MoralDomainData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load domain data on mount
  useEffect(() => {
    const fetchDomain = async () => {
      try {
        const encodedName = encodeURIComponent(domainName.trim());
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_ROUTE}/source/get-moral-domain/${encodedName}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to load domain: ${response.status} ${errorText}`);
        }

        const data: MoralDomainData = await response.json();

        // Basic validation
        if (!data) {
          throw new Error("Invalid data received from API.");
        }
        setFormData(data);
      } catch (error: any) {
        console.error("Error loading domain:", error);
        toast.error(
          error.message || "Could not load domain. Please check the name or connection."
        );
      } finally {
        setLoading(false);
      }
    };

    if (domainName) {
      fetchDomain();
    } else {
      toast.error("Domain name not provided.");
      setLoading(false);
    }
  }, [domainName]);

  // Update simple fields
  const handleChange = (field: keyof MoralDomainData, value: string) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Update array fields (string → array)
  const handleArrayChange = (
    field: "tier_1_sources" | "tier_2_sources" | "tier_3_sources",
    value: string
  ) => {
    const array = value
      .split("\n")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    setFormData((prev) => (prev ? { ...prev, [field]: array } : null));
  };

  const handleSubmit = async () => {
    if (!formData) return;
    if (!formData._additional.id.trim()) {
      toast.error("Domain id is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const encodedName = encodeURIComponent(formData._additional.id.trim());
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _additional, ...formDataClean } = formData;
      const response = await fetch(
  
        `${process.env.NEXT_PUBLIC_ROUTE}/source/update-moral-domain/${encodedName}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formDataClean),
        }
      );

      if (response.ok) {
        toast.success(`✅ Domain "${formData.domain}" updated successfully.`);
        if (onSuccess) onSuccess();
      } else {
        let errorData;
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          errorData = await response.json();
        } else {
          errorData = { error: await response.text() };
        }

        if (errorData.error?.includes("not found")) {
          toast.error(`❌ Domain not found: "${formData.domain}"`);
        } else if (errorData.error) {
          toast.error(`❌ Error: ${errorData.error}`);
        } else {
          toast.error("❌ Update failed: unexpected server response.");
        }
      }
    } catch (error: any) {
      console.error("Network error while updating domain:", error);
      toast.error(
        error.message
          ? `🌐 ${error.message}`
          : "❌ Could not connect to server. Please check if the API is running."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading domain...</CardTitle>
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
          <CardTitle>Failed to load domain</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Could not load data for domain &quot;{domainName}&quot;.</p>
        </CardContent>
        <CardFooter>
          <Button variant="secondary" onClick={onCancel}>
            Back
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Domain: {formData.domain}</CardTitle>
        <CardDescription>
          Update the fields and save changes to the GoldCare AI system.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium">Domain Name</label>
          <Input
            value={formData.domain}
            onChange={(e) => handleChange("domain", e.target.value)}
            placeholder="e.g.: Moral Foundations"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Priority</label>
          <Input
            value={formData.priority}
            onChange={(e) => handleChange("priority", e.target.value)}
            placeholder="e.g.: foundational"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Anchor Behavior</label>
          <Input
            value={formData.anchor_behavior}
            onChange={(e) => handleChange("anchor_behavior", e.target.value)}
            placeholder="e.g.: global"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Override Policy</label>
          <Input
            value={formData.override_policy}
            onChange={(e) => handleChange("override_policy", e.target.value)}
            placeholder="e.g.: non-removable"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Binding</label>
          <Input
            value={formData.binding}
            onChange={(e) => handleChange("binding", e.target.value)}
            placeholder="e.g.: all_domains"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Bound To</label>
          <Input
            value={formData.bound_to}
            onChange={(e) => handleChange("bound_to", e.target.value)}
            placeholder="e.g.: Moral Foundations"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Moral Inheritance Policy</label>
          <Textarea
            value={formData.moral_inheritance_policy}
            onChange={(e) =>
              handleChange("moral_inheritance_policy", e.target.value)
            }
            rows={5}
            placeholder="Describe the core ethical policy..."
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Clinical Reference Rationale</label>
          <Textarea
            value={formData.clinical_reference_rationale}
            onChange={(e) =>
              handleChange("clinical_reference_rationale", e.target.value)
            }
            rows={5}
            placeholder="Justification for clinical use..."
            required
          />
        </div>

        {/* Tier 1 Sources */}
        <div>
          <label className="text-sm font-medium">
            Tier 1 Sources (one per line)
          </label>
          <Textarea
            value={formData.tier_1_sources.join("\n")}
            onChange={(e) =>
              handleArrayChange("tier_1_sources", e.target.value)
            }
            rows={6}
            className="font-mono text-sm"
            placeholder="Torah and Tanakh&#10;Dennis Prager & Joseph Telushkin..."
            required
          />
        </div>

        {/* Tier 2 Sources */}
        <div>
          <label className="text-sm font-medium">
            Tier 2 Sources (one per line)
          </label>
          <Textarea
            value={formData.tier_2_sources.join("\n")}
            onChange={(e) =>
              handleArrayChange("tier_2_sources", e.target.value)
            }
            rows={5}
            className="font-mono text-sm"
            placeholder="Rabbi J. David Bleich...&#10;Fred Rosner..."
            required
          />
        </div>

        {/* Tier 3 Sources */}
        <div>
          <label className="text-sm font-medium">
            Tier 3 Sources (one per line)
          </label>
          <Textarea
            value={formData.tier_3_sources.join("\n")}
            onChange={(e) =>
              handleArrayChange("tier_3_sources", e.target.value)
            }
            rows={5}
            className="font-mono text-sm"
            placeholder="Jewish Medical Ethics...&#10;Rabbinical Council..."
            required
          />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? "Saving..." : "💾 Save Changes"}
        </Button>
        {onCancel && (
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}