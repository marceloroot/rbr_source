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

// Tipo para os dados
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
}

interface EditMoralDomainFormProps {
  domainName: string;
  onSuccess?: () => void; // Callback opcional após sucesso
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

  // Carregar dados do domínio ao montar
  useEffect(() => {
    const fetchDomain = async () => {
      try {
        const encodedName = encodeURIComponent(domainName.trim());
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_ROUTE}/source/get-moral-domain/${encodedName}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Falha ao carregar domínio: ${response.status} ${errorText}`);
        }

        const data: MoralDomainData = await response.json();

        // Validação básica
        if (!data) {
          throw new Error("Dados inválidos recebidos da API.");
        }

        setFormData(data);
      } catch (error: any) {
        console.error("Erro ao carregar domínio:", error);
        toast.error(
          error.message || "Não foi possível carregar o domínio. Verifique o nome ou a conexão."
        );
      } finally {
        setLoading(false);
      }
    };

    if (domainName) {
      fetchDomain();
    } else {
      toast.error("Nome do domínio não fornecido.");
      setLoading(false);
    }
  }, [domainName]);

  // Atualiza campos simples
  const handleChange = (field: keyof MoralDomainData, value: string) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Atualiza campos de lista (string → array)
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
    if (!formData.domain.trim()) {
      toast.error("O nome do domínio é obrigatório.");
      return;
    }

    setIsSubmitting(true);

    try {
      const encodedName = encodeURIComponent(formData.domain.trim());
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ROUTE}/source/update-moral-domain/${encodedName}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        toast.success(`✅ Domínio "${formData.domain}" atualizado com sucesso.`);
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
          toast.error(`❌ Domínio não encontrado: "${formData.domain}"`);
        } else if (errorData.error) {
          toast.error(`❌ Erro: ${errorData.error}`);
        } else {
          toast.error("❌ Falha ao atualizar: resposta inesperada do servidor.");
        }
      }
    } catch (error: any) {
      console.error("Erro de rede ao atualizar domínio:", error);
      toast.error(
        error.message
          ? `🌐 ${error.message}`
          : "❌ Não foi possível conectar ao servidor. Verifique se a API está rodando."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando domínio...</CardTitle>
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
          <CardTitle>Erro ao carregar domínio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Não foi possível carregar os dados do domínio &quot;{domainName}&quot;.</p>
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
        <CardTitle>Editar Domínio: {formData.domain}</CardTitle>
        <CardDescription>
          Atualize os campos e salve as alterações no sistema GoldCare AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium">Nome do Domínio</label>
          <Input
            value={formData.domain}
            onChange={(e) => handleChange("domain", e.target.value)}
            placeholder="Ex: Moral Foundations"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Prioridade</label>
          <Input
            value={formData.priority}
            onChange={(e) => handleChange("priority", e.target.value)}
            placeholder="Ex: foundational"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Comportamento de Âncora</label>
          <Input
            value={formData.anchor_behavior}
            onChange={(e) => handleChange("anchor_behavior", e.target.value)}
            placeholder="Ex: global"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Política de Substituição</label>
          <Input
            value={formData.override_policy}
            onChange={(e) => handleChange("override_policy", e.target.value)}
            placeholder="Ex: non-removable"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Vinculação</label>
          <Input
            value={formData.binding}
            onChange={(e) => handleChange("binding", e.target.value)}
            placeholder="Ex: all_domains"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Vinculado a</label>
          <Input
            value={formData.bound_to}
            onChange={(e) => handleChange("bound_to", e.target.value)}
            placeholder="Ex: Moral Foundations"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Política de Herança Moral</label>
          <Textarea
            value={formData.moral_inheritance_policy}
            onChange={(e) =>
              handleChange("moral_inheritance_policy", e.target.value)
            }
            rows={5}
            placeholder="Descreva a política ética central..."
          />
        </div>

        <div>
          <label className="text-sm font-medium">Justificativa Clínica</label>
          <Textarea
            value={formData.clinical_reference_rationale}
            onChange={(e) =>
              handleChange("clinical_reference_rationale", e.target.value)
            }
            rows={5}
            placeholder="Justificativa para uso clínico..."
          />
        </div>

        {/* Tier 1 Sources */}
        <div>
          <label className="text-sm font-medium">
            Fontes Tier 1 (uma por linha)
          </label>
          <Textarea
            value={formData.tier_1_sources.join("\n")}
            onChange={(e) =>
              handleArrayChange("tier_1_sources", e.target.value)
            }
            rows={6}
            className="font-mono text-sm"
            placeholder="Torah and Tanakh&#10;Dennis Prager & Joseph Telushkin..."
          />
        </div>

        {/* Tier 2 Sources */}
        <div>
          <label className="text-sm font-medium">
            Fontes Tier 2 (uma por linha)
          </label>
          <Textarea
            value={formData.tier_2_sources.join("\n")}
            onChange={(e) =>
              handleArrayChange("tier_2_sources", e.target.value)
            }
            rows={5}
            className="font-mono text-sm"
            placeholder="Rabbi J. David Bleich...&#10;Fred Rosner..."
          />
        </div>

        {/* Tier 3 Sources */}
        <div>
          <label className="text-sm font-medium">
            Fontes Tier 3 (uma por linha)
          </label>
          <Textarea
            value={formData.tier_3_sources.join("\n")}
            onChange={(e) =>
              handleArrayChange("tier_3_sources", e.target.value)
            }
            rows={5}
            className="font-mono text-sm"
            placeholder="Jewish Medical Ethics...&#10;Rabbinical Council..."
          />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? "Salvando..." : "💾 Salvar Alterações"}
        </Button>
        {onCancel && (
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}