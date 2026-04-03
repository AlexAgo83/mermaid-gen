import type { ProviderId } from "@/lib/llm";
import type { SvgMetrics } from "@/lib/mermaid";

export type Viewport = {
  scale: number;
  x: number;
  y: number;
};

export type RenderErrorCopy = {
  title: string;
  message: string;
};

export type RenderState =
  | {
      status: "loading";
      error: null;
      svg: string;
      metrics: SvgMetrics | null;
    }
  | {
      status: "ready";
      error: null;
      svg: string;
      metrics: SvgMetrics;
    }
  | {
      status: "error";
      error: RenderErrorCopy;
      svg: string;
      metrics: null;
    };

export type ProviderKeyStore = Record<ProviderId, string>;

export type ProviderSettings = {
  activeProviderId: ProviderId;
  providerKeys: ProviderKeyStore;
};

export type HelpTopic = "source" | "prompt" | "preview" | null;
export type ExportFormat = "svg" | "png";
export type OnboardingState = "pending" | "dismissed" | "completed";
export type SourceOrigin = "manual" | "generated";
