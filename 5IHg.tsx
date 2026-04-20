import React, { useMemo, useState } from "react";
import { router } from "expo-router";
import { useRisk, type RiskResponse } from "./RiskContext";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import {
  SafeAreaView,
  Text,
  TextInput,
  Button,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

const API_BASE = "http://localhost:8000";

function num(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function MainTab() {
  const { setRisk } = useRisk();

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
  }, [
    overall,
    project,
    people,
    teamCut,
    complexity,
    clarity,
    dependency,
    expertise,
    daysToDeadline,
  ]);

  const validate = () => {
    setError(null);

    for (const [k, v] of Object.entries(payload)) {
      if (v === null) {
        setError(`${k} must be a number`);
        return false;
      }
    }

    const p = payload as Record<string, number>;

    if (p.overall < 0 || p.project < 0 || p.team_cut < 0) {
      setError("Budget values must be 0 or greater.");
      return false;
    }

    if (p.team_cut > 100) {
      setError("Team cut must be between 0 and 100.");
      return false;
    }

    if (p.people < 1) {
      setError("People must be at least 1.");
      return false;
    }

    if (p.days_to_deadline < 0) {
      setError("Days to deadline must be 0 or greater.");
      return false;
    }

    const in15 = (x: number) => x >= 1 && x <= 5;

    if (!in15(p.expertise)) {
      setError("Team expertise must be 1–5.");
      return false;
    }

    if (!in15(p.complexity)) {
      setError("Project complexity must be 1–5.");
      return false;
    }

    if (!in15(p.clarity)) {
      setError("Requirements clarity must be 1–5.");
      return false;
    }

    if (!in15(p.dependency)) {
      setError("External dependency must be 1–5.");
      return false;
    }

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

      const json: RiskResponse = await res.json();

      if (!res.ok) {
        throw new Error(
          (json as any)?.detail
            ? JSON.stringify((json as any).detail)
            : JSON.stringify(json)
        );
      }

      setResult(json);
      setRisk(payload as any, json);

      if (json.download_url && json.excel_file) {
        const localUri = `${FileSystem.documentDirectory}${json.excel_file}`;
        const downloadResult = await FileSystem.downloadAsync(
          json.download_url,
          localUri
        );

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            dialogTitle: "Share risk matrix export",
            UTI: "org.openxmlformats.spreadsheetml.sheet",
          });
        }
      }

      router.push("/(tabs)/insight");
    } catch (e: any) {
      setResult(null);
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
          <Text style={{ fontSize: 22, fontWeight: "700" }}>
            Risk Analysis Calculator
          </Text>

          <Text style={{ fontSize: 16, fontWeight: "700" }}>
            Project Inputs
          </Text>

          <Text>Overall Budget (£)</Text>
          <TextInput
            value={overall}
            onChangeText={setOverall}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>Project Cost (£)</Text>
          <TextInput
            value={project}
            onChangeText={setProject}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>People on Project</Text>
          <TextInput
            value={people}
            onChangeText={setPeople}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>Team Cut (%)</Text>
          <TextInput
            value={teamCut}
            onChangeText={setTeamCut}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>Days Until Deadline</Text>
          <TextInput
            value={daysToDeadline}
            onChangeText={setDaysToDeadline}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text style={{ fontWeight: "700", marginTop: 6 }}>
            Risk Factors (Rate Each 1–5)
          </Text>

          <Text>Project Complexity (1–5)</Text>
          <TextInput
            value={complexity}
            onChangeText={setComplexity}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>Requirements Clarity (1–5)</Text>
          <TextInput
            value={clarity}
            onChangeText={setClarity}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>External Dependency (1–5)</Text>
          <TextInput
            value={dependency}
            onChangeText={setDependency}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>Team Expertise (1–5)</Text>
          <TextInput
            value={expertise}
            onChangeText={setExpertise}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Button
            title={loading ? "Calculating..." : "Calculate"}
            onPress={calculate}
            disabled={loading}
          />

          {loading ? <ActivityIndicator /> : null}

          {error ? <Text style={{ color: "crimson" }}>Error: {error}</Text> : null}

          {result ? (
            <Text style={{ opacity: 0.7 }}>
              Latest result: {result.overall_risk_score}/5 ({result.risk_level})
            </Text>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}