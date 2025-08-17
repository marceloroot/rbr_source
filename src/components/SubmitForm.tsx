// components/SubmitForm.tsx
"use client";

import { useState } from "react";
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
  domain_name: string;
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

// Dados iniciais (agora como valor padrão, mas editável)
const defaultData: MoralDomainData = {
  domain_name: "Moral Foundations",
  priority: "foundational",
  anchor_behavior: "global",
  override_policy: "non-removable",
  binding: "all_domains",
  bound_to: "Moral Foundations",
  moral_inheritance_policy:
    "Moral Foundations is the governing domain that provides the ethical framework for all GoldCare AI decisions. This domain cannot be bypassed, overridden, or compromised under any circumstances. All clinical recommendations must align with Jewish moral principles emphasizing the sanctity of life (pikuach nefesh), healing obligations, and ethical medical practice.",
  tier_1_sources: [
    "Torah and Tanakh (esp. Deuteronomy: 'choose life')",
    "Dennis Prager & Joseph Telushkin: Why the Jews?",
    "Ken Spiro: WorldPerfect: The Jewish Impact on Civilization",
    "Rabbi Abraham Joshua Heschel: The Prophets",
    "Maimonides: Mishneh Torah - Laws of Medicine and Healing",
    "Rabbi David Bleich: Bioethical Dilemmas: A Jewish Perspective",
  ],
  tier_2_sources: [
    "Rabbi J. David Bleich: Contemporary Halakhic Problems",
    "Fred Rosner: Modern Medicine and Jewish Ethics",
    "Abraham Steinberg: Encyclopedia of Jewish Medical Ethics",
    "Rabbi Moshe Feinstein: Igrot Moshe (Medical Responsa)",
    "Avraham Sofer Abraham: Nishmat Avraham - Medical Halacha",
  ],
  tier_3_sources: [
    "Jewish Medical Ethics and Halacha Commission Guidelines",
    "Rabbinical Council of America Medical Ethics Positions",
    "Association of Orthodox Jewish Scientists Publications",
    "Puah Institute Medical Halacha Guidelines",
    "Star-K Kashrus and Medical Ethics Resources",
  ],
  clinical_reference_rationale:
    "This domain serves as the inviolable moral spine of GoldCare AI, ensuring that all medical recommendations and advice are grounded in Jewish ethical principles that have guided healthcare decisions for millennia. The domain prioritizes the sanctity of human life (pikuach nefesh), the obligation to heal (refuah), and ethical medical practice as defined by Jewish law and wisdom. This moral framework cannot be overridden by clinical considerations alone, as it provides the essential ethical foundation that distinguishes GoldCare from purely secular medical AI systems. Every recommendation must pass through this moral filter to ensure alignment with Jewish values while providing the highest quality medical guidance.",
};



export default function SubmitForm() {
  // Estado com todos os campos editáveis
  const [formData, setFormData] = useState<MoralDomainData>(defaultData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Atualiza campos simples
  const handleChange = (field: keyof MoralDomainData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    setFormData((prev) => ({ ...prev, [field]: array }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ROUTE}/source/ingest-moral-domain`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        toast.success("✅ Domínio moral enviado com sucesso.");
      } else {
        // Tenta ler como JSON primeiro
        let errorData;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json();
        } else {
          // Se não for JSON, usa texto
          errorData = { error: await response.text() };
        }

        // Trata o erro com base na estrutura conhecida
        if (errorData.error) {
          if (errorData.error.includes("already exists")) {
            const domainName =
              errorData.existing?.domain || formData.domain_name;

            // Mostra toast com opção de ver detalhes
            toast.error(`⚠️ Domínio "${domainName}" já existe`, {
              description: (
                <div className="mt-2 text-sm">
                  <p className="text-red-500">
                    Este domínio já está registrado com as mesmas políticas.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      console.log("Domínio existente:", errorData.existing);
                      toast.info("Detalhes no console");
                    }}
                  >
                    Ver no console
                  </Button>
                </div>
              ),
              duration: 5000,
            });

            // Opcional: atualiza o formulário com os dados existentes
            if (errorData.existing) {
              setFormData({
                domain_name: errorData.existing.domain,
                priority: errorData.existing.priority,
                anchor_behavior: errorData.existing.anchor_behavior,
                override_policy: errorData.existing.override_policy,
                binding: errorData.existing.binding,
                bound_to: errorData.existing.bound_to,
                moral_inheritance_policy:
                  errorData.existing.moral_inheritance_policy,
                tier_1_sources: errorData.existing.tier_1_sources,
                tier_2_sources: errorData.existing.tier_2_sources,
                tier_3_sources: errorData.existing.tier_3_sources,
                clinical_reference_rationale:
                  errorData.existing.clinical_reference_rationale,
              });
            }
          } else {
            toast.error(`❌ Erro: ${errorData.error}`);
          }
        } else {
          toast.error("❌ Falha ao enviar: Resposta inesperada do servidor.");
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Erro de rede ou outro problema:", error);
      toast.error(
        error.message
          ? `🌐 ${error.message}`
          : "❌ Não foi possível conectar ao servidor. Verifique se a API está rodando."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editar e Enviar Domínio</CardTitle>
        <CardDescription>
          Preencha ou ajuste os campos e envie ao sistema GoldCare AI.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium">Nome do Domínio</label>
          <Input
            value={formData.domain_name}
            onChange={(e) => handleChange("domain_name", e.target.value)}
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
          <label className="text-sm font-medium">
            Política de Substituição
          </label>
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
          <label className="text-sm font-medium">
            Política de Herança Moral
          </label>
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

        {/* Campos de lista: Tier 1 */}
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

        {/* Tier 2 */}
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

        {/* Tier 3 */}
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
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Enviando..." : "📤 Enviar Domínio Moral"}
        </Button>
      </CardFooter>
    </Card>
  );
}
