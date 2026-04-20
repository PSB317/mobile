import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  Text,
  TextInput,
  Button,
  View,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

const API_BASE = "http://192.168.1.94:8000";

type RiskResponse = {
  overall: number;
  project: number;
  team_cut: number;
  per_person: number;
  remaining: number;
  expertise: number;
  days_to_deadline: number;
  estimated_days: number;
  optimistic_days: number;
  likely_days: number;
  pessimistic_days: number;
  complexity: number;
  clarity: number;
  dependency: number;
  risk_score: number;
  risk_level: string;
  reasons: string[];
  contingency: number;
  contingency_lvl: string;
  schedule_buffer: number;
  schedule_lab: string;
};

function num(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function money(n: number) {
  return n.toFixed(2);
}

export default function MainTab() {
  const [overall, setOverall] = useState("10000");
  const [project, setProject] = useState("3000");
  const [people, setPeople] = useState("3");
  const [teamCut, setTeamCut] = useState("10");
  const [daysToDeadline, setDaysToDeadline] = useState("30");

  const [expertise, setExpertise] = useState("3");
  const [complexity, setComplexity] = useState("3");
  const [clarity, setClarity] = useState("4");
  const [dependency, setDependency] = useState("2");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RiskResponse | null>(null);

  const payload = useMemo(() => {
    return {
      overall: num(overall),
      project: num(project),
      people: num(people),
      team_cut: num(teamCut),
      complexity: num(complexity),
      clarity: num(clarity),
      dependency: num(dependency),
      expertise: num(expertise),
      days_to_deadline: num(daysToDeadline),
    };
  }, [overall, project, people, teamCut, complexity, clarity, dependency, expertise, daysToDeadline]);

  const validate = () => {
    setError(null);

    for (const [k, v] of Object.entries(payload)) {
      if (v === null) {
        setError(`${k} must be a number`);
        return false;
      }
    }

    const p = payload as Record<string, number>;
    if (p.overall < 0 || p.project < 0 || p.team_cut < 0)
      return setError("Budget values must be 0 or greater."), false;
    if (p.people < 1)
      return setError("People must be at least 1."), false;
    if (p.days_to_deadline < 0)
      return setError("Days to deadline must be 0 or greater."), false;

    const in15 = (x: number) => x >= 1 && x <= 5;
    if (!in15(p.expertise)) return setError("Team expertise must be 1–5."), false;
    if (!in15(p.complexity)) return setError("Project complexity must be 1–5."), false;
    if (!in15(p.clarity)) return setError("Requirements clarity must be 1–5."), false;
    if (!in15(p.dependency)) return setError("External dependency must be 1–5."), false;

    return true;
  };

  const calculate = async () => {
    if (!validate()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/risk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.detail ? JSON.stringify(json.detail) : JSON.stringify(json));
      }

      setResult(json as RiskResponse);
    } catch (e: any) {
      setResult(null);
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
          <Text style={{ fontSize: 22, fontWeight: "700" }}>Risk Analysis Calculator</Text>

          <Text style={{ fontSize: 16, fontWeight: "700" }}>Project Inputs</Text>

          <Text>Overall Budget (£)</Text>
          <TextInput value={overall} onChangeText={setOverall} keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

          <Text>Project Cost (£)</Text>
          <TextInput value={project} onChangeText={setProject} keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

          <Text>People on Project</Text>
          <TextInput value={people} onChangeText={setPeople} keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

          <Text>Team Cut (%)</Text>
          <TextInput value={teamCut} onChangeText={setTeamCut} keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

          <Text>Days Until Deadline</Text>
          <TextInput value={daysToDeadline} onChangeText={setDaysToDeadline} keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

          <Text style={{ fontWeight: "700", marginTop: 6 }}>
            Risk Factors (Rate Each 1–5)
          </Text>

          <Text>Project Complexity (1–5)</Text>
          <TextInput value={complexity} onChangeText={setComplexity} keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

          <Text>Requirements Clarity (1–5)</Text>
          <TextInput value={clarity} onChangeText={setClarity} keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

          <Text>External Dependency (1–5)</Text>
          <TextInput value={dependency} onChangeText={setDependency} keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

          <Text>Team Expertise (1–5)</Text>
          <TextInput value={expertise} onChangeText={setExpertise} keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }} />

          <Button title={loading ? "Calculating..." : "Calculate"} onPress={calculate} disabled={loading} />
          {loading ? <ActivityIndicator /> : null}
          {error ? <Text style={{ color: "crimson" }}>Error: {error}</Text> : null}

          {result ? (
            <View style={{ marginTop: 12, padding: 14, borderWidth: 1, borderRadius: 12, gap: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: "800" }}>Results</Text>

              <Text>Team Cut Per Person: {money(result.per_person)}</Text>
              <Text style={{ fontWeight: "800" }}>Remaining Budget: {money(result.remaining)}</Text>
              <Text>Estimated Project Duration: {result.estimated_days} days</Text>

              <Text>Project Complexity: {result.complexity}/5</Text>
              <Text>Requirements Clarity: {result.clarity}/5</Text>
              <Text>External Dependency: {result.dependency}/5</Text>

              <Text style={{ fontWeight: "800" }}>
                Risk Score: {result.risk_score}/5 ({result.risk_level})
              </Text>

              <Text>
                Contingency: {result.contingency.toFixed?.(1) ?? result.contingency}% ({result.contingency_lvl})
              </Text>

              <Text>Schedule: {result.schedule_lab}</Text>

              <Text>
                Duration Estimate: {result.optimistic_days} / {result.likely_days} / {result.pessimistic_days} days
              </Text>

              <Text style={{ fontWeight: "800", marginTop: 6 }}>Reasons</Text>
              {result.reasons?.length
                ? result.reasons.map((r, i) => <Text key={i}>• {r}</Text>)
                : <Text>• None</Text>}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}