import React, { useMemo, useState } from "react";
import { router } from "expo-router";
import { useRisk, type RiskResponse } from "./RiskContext";
import * as FileSystem from "expo-file-system/legacy";

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
  const { setRisk, addExport } = useRisk();

  const [overall, setOverall] = useState("10000");
  const [project, setProject] = useState("3000");
  const [people, setPeople] = useState("3");
  const [teamCut, setTeamCut] = useState("10");
  const [daysToDeadline, setDaysToDeadline] = useState("30");

  const [expertise, setExpertise] = useState("3");
  const [complexity, setComplexity] = useState("3");
  const [clarity, setClarity] = useState("4");
  const [dependency, setDependency] = useState("2");

  const [probExpertiseWeight, setProbExpertiseWeight] = useState("0.25");
  const [probScheduleWeight, setProbScheduleWeight] = useState("0.30");
  const [probClarityWeight, setProbClarityWeight] = useState("0.20");
  const [probDependencyWeight, setProbDependencyWeight] = useState("0.15");
  const [probComplexityWeight, setProbComplexityWeight] = useState("0.10");

  const [impactBudgetWeight, setImpactBudgetWeight] = useState("0.30");
  const [impactComplexityWeight, setImpactComplexityWeight] = useState("0.25");
  const [impactClarityWeight, setImpactClarityWeight] = useState("0.15");
  const [impactDependencyWeight, setImpactDependencyWeight] = useState("0.20");
  const [impactScheduleWeight, setImpactScheduleWeight] = useState("0.10");

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
      weights: {
        probability: {
          expertise: num(probExpertiseWeight),
          schedule_pressure: num(probScheduleWeight),
          clarity: num(probClarityWeight),
          dependency: num(probDependencyWeight),
          complexity: num(probComplexityWeight),
        },
        impact: {
          budget: num(impactBudgetWeight),
          complexity: num(impactComplexityWeight),
          clarity: num(impactClarityWeight),
          dependency: num(impactDependencyWeight),
          schedule_impact: num(impactScheduleWeight),
        },
      },
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
    probExpertiseWeight,
    probScheduleWeight,
    probClarityWeight,
    probDependencyWeight,
    probComplexityWeight,
    impactBudgetWeight,
    impactComplexityWeight,
    impactClarityWeight,
    impactDependencyWeight,
    impactScheduleWeight,
  ]);

  const validate = () => {
    setError(null);

    const coreFields = {
      overall: payload.overall,
      project: payload.project,
      people: payload.people,
      team_cut: payload.team_cut,
      complexity: payload.complexity,
      clarity: payload.clarity,
      dependency: payload.dependency,
      expertise: payload.expertise,
      days_to_deadline: payload.days_to_deadline,
    };

    for (const [k, v] of Object.entries(coreFields)) {
      if (v === null) {
        setError(`${k} must be a number`);
        return false;
      }
    }

    const p = coreFields as Record<string, number>;

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

    const weightValues = [
      payload.weights.probability.expertise,
      payload.weights.probability.schedule_pressure,
      payload.weights.probability.clarity,
      payload.weights.probability.dependency,
      payload.weights.probability.complexity,
      payload.weights.impact.budget,
      payload.weights.impact.complexity,
      payload.weights.impact.clarity,
      payload.weights.impact.dependency,
      payload.weights.impact.schedule_impact,
    ];

    for (const w of weightValues) {
      if (w === null) {
        setError("All weight values must be numbers.");
        return false;
      }
      if (w < 0) {
        setError("Weights must be 0 or greater.");
        return false;
      }
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

      let localFileUri: string | undefined;

      if (json.download_url && json.excel_file) {
        const localUri = `${FileSystem.documentDirectory}${json.excel_file}`;
        const downloadResult = await FileSystem.downloadAsync(
          json.download_url,
          localUri
        );
        localFileUri = downloadResult.uri;

        addExport({
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          title: `Risk Report - ${json.risk_level}`,
          excel_file: json.excel_file,
          download_url: json.download_url,
          local_file_uri: downloadResult.uri,
          overall_risk_score: json.overall_risk_score,
          risk_level: json.risk_level,
          probability_score: json.probability_score,
          impact_score: json.impact_score,
        });
      }

      const enrichedResult: RiskResponse = {
        ...json,
        local_file_uri: localFileUri,
      };

      setResult(enrichedResult);
      setRisk(payload as any, enrichedResult);

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

          <Text>Overall Budget allocated for team and project (£)</Text>
          <TextInput
            value={overall}
            onChangeText={setOverall}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>
            Project Cost - How much will be allocated to developing the project (£)
          </Text>
          <TextInput
            value={project}
            onChangeText={setProject}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>
            People on Project (How many employees are working on this project)
          </Text>
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

          <Text>Days Until Deadline (how many days till project is due)</Text>
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

          <Text>
            Requirements Clarity - Are the project objectives clear to the team ? (1–5)
          </Text>
          <TextInput
            value={clarity}
            onChangeText={setClarity}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>How many external dependencies is the project reliant on? (1–5)</Text>
          <TextInput
            value={dependency}
            onChangeText={setDependency}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>
            Team Expertise - How experienced is the team in delivering this project? (1–5)
          </Text>
          <TextInput
            value={expertise}
            onChangeText={setExpertise}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text style={{ fontWeight: "700", marginTop: 12 }}>
            Probability Weights
          </Text>

          <Text>Expertise Weight</Text>
          <TextInput
            value={probExpertiseWeight}
            onChangeText={setProbExpertiseWeight}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>Schedule Pressure Weight</Text>
          <TextInput
            value={probScheduleWeight}
            onChangeText={setProbScheduleWeight}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>Clarity Weight</Text>
          <TextInput
            value={probClarityWeight}
            onChangeText={setProbClarityWeight}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>Dependency Weight</Text>
          <TextInput
            value={probDependencyWeight}
            onChangeText={setProbDependencyWeight}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>Complexity Weight</Text>
          <TextInput
            value={probComplexityWeight}
            onChangeText={setProbComplexityWeight}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text style={{ fontWeight: "700", marginTop: 12 }}>
            Impact Weights
          </Text>

          <Text>Budget Weight</Text>
          <TextInput
            value={impactBudgetWeight}
            onChangeText={setImpactBudgetWeight}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>Complexity Weight</Text>
          <TextInput
            value={impactComplexityWeight}
            onChangeText={setImpactComplexityWeight}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>Clarity Weight</Text>
          <TextInput
            value={impactClarityWeight}
            onChangeText={setImpactClarityWeight}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>Dependency Weight</Text>
          <TextInput
            value={impactDependencyWeight}
            onChangeText={setImpactDependencyWeight}
            keyboardType="numeric"
            style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
          />

          <Text>Schedule Impact Weight</Text>
          <TextInput
            value={impactScheduleWeight}
            onChangeText={setImpactScheduleWeight}
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