import React, { createContext, useContext, useMemo, useState } from "react";

export type RiskResponse = {
  overall: number;
  project: number;
  team_cut_amount: number;
  available_budget: number;
  per_person: number;
  remaining: number;
  remaining_percent: number;
  budget_status: string;

  expertise: number;
  days_to_deadline: number;
  estimated_days: number;
  optimistic_days: number;
  expected_days: number;
  pessimistic_days: number;

  complexity: number;
  clarity: number;
  dependency: number;

  contingency_percent: number;
  contingency_level: string;
  schedule_buffer: number;
  schedule_label: string;

  probability_score: number;
  impact_score: number;
  raw_risk_score: number;
  overall_risk_score: number;
  risk_level: string;

  factor_ratings: Record<string, number>;
  probability_reasons: string[];
  impact_reasons: string[];

  excel_file?: string;
  download_url?: string;
  local_file_uri?: string;
};

export type RiskInputs = {
  overall: number;
  project: number;
  people: number;
  team_cut: number;
  complexity: number;
  clarity: number;
  dependency: number;
  expertise: number;
  days_to_deadline: number;
  weights: {
    probability: {
      expertise: number | null;
      schedule_pressure: number | null;
      clarity: number | null;
      dependency: number | null;
      complexity: number | null;
    };
    impact: {
      budget: number | null;
      complexity: number | null;
      clarity: number | null;
      dependency: number | null;
      schedule_impact: number | null;
    };
  };
};

export type ExportItem = {
  id: string;
  createdAt: string;
  title: string;
  excel_file: string;
  download_url: string;
  local_file_uri?: string;
  overall_risk_score: number;
  risk_level: string;
  probability_score: number;
  impact_score: number;
};

type RiskState = {
  inputs: RiskInputs | null;
  result: RiskResponse | null;
  exports: ExportItem[];
  setRisk: (inputs: RiskInputs, result: RiskResponse) => void;
  addExport: (item: ExportItem) => void;
  clearRisk: () => void;
};

const RiskCtx = createContext<RiskState | null>(null);

export function RiskProvider({ children }: { children: React.ReactNode }) {
  const [inputs, setInputs] = useState<RiskInputs | null>(null);
  const [result, setResult] = useState<RiskResponse | null>(null);
  const [exports, setExports] = useState<ExportItem[]>([]);

  const value = useMemo<RiskState>(() => ({
    inputs,
    result,
    exports,
    setRisk: (i, r) => {
      setInputs(i);
      setResult(r);
    },
    addExport: (item) => {
      setExports((prev) => [item, ...prev]);
    },
    clearRisk: () => {
      setInputs(null);
      setResult(null);
    },
  }), [inputs, result, exports]);

  return <RiskCtx.Provider value={value}>{children}</RiskCtx.Provider>;
}

export function useRisk() {
  const ctx = useContext(RiskCtx);
  if (!ctx) throw new Error("useRisk must be used within RiskProvider");
  return ctx;
}