import React from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { useRisk } from "./RiskContext";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function Bar({
  label,
  value,
  max = 5,
  helper,
  valueLabel,
}: {
  label: string;
  value: number;
  max?: number;
  helper?: string;
  valueLabel?: string;
}) {
  const pct = clamp01(value / max);

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontWeight: "700" }}>{label}</Text>
        <Text>{valueLabel ?? `${value}/${max}`}</Text>
      </View>
      {helper ? <Text style={{ opacity: 0.65 }}>{helper}</Text> : null}
      <View style={{ height: 10, backgroundColor: "#E5E7EB", borderRadius: 999 }}>
        <View
          style={{
            height: 10,
            width: `${pct * 100}%`,
            backgroundColor: "#111827",
            borderRadius: 999,
          }}
        />
      </View>
    </View>
  );
}

type Driver = {
  key: string;
  title: string;
  score: number;
  impact: "Low" | "Moderate" | "High";
  explanation: string;
  action: string;
};

function getImpactLabel(score: number): "Low" | "Moderate" | "High" {
  if (score >= 4) return "High";
  if (score >= 3) return "Moderate";
  return "Low";
}

function buildRiskDrivers(result: {
  complexity: number;
  clarity: number;
  dependency: number;
  expertise: number;
}): Driver[] {
  const drivers: Driver[] = [];

  // Higher complexity = higher risk
  drivers.push({
    key: "complexity",
    title: "Project complexity",
    score: result.complexity,
    impact: getImpactLabel(result.complexity),
    explanation:
      result.complexity >= 4
        ? `Your complexity rating is ${result.complexity}/5, which is a strong driver of risk. More complex projects usually involve more coordination, more unknowns, and a higher chance of delays or cost overruns.`
        : result.complexity === 3
        ? `Your complexity rating is 3/5, so complexity is a moderate source of risk. The project has some delivery difficulty, but it should be manageable with good planning.`
        : `Your complexity rating is ${result.complexity}/5, so complexity is not currently a major risk driver.`,
    action:
      result.complexity >= 4
        ? "Break the work into smaller phases, define milestones early, and include contingency in the timeline and budget."
        : result.complexity === 3
        ? "Use phased delivery and clear milestones to keep complexity under control."
        : "Continue using a simple delivery structure and monitor for new complexity.",
  });

  // Lower clarity = higher risk
  const clarityRisk = 6 - result.clarity;
  drivers.push({
    key: "clarity",
    title: "Requirements clarity",
    score: clarityRisk,
    impact: getImpactLabel(clarityRisk),
    explanation:
      result.clarity <= 2
        ? `Your requirements clarity rating is ${result.clarity}/5, which means unclear requirements are strongly increasing risk. This can lead to scope changes, rework, and misalignment with client expectations.`
        : result.clarity === 3
        ? "Your requirements clarity rating is 3/5, so some uncertainty remains. This creates a moderate risk of rework or changing scope during delivery."
        : `Your requirements clarity rating is ${result.clarity}/5, so unclear requirements are not currently a major risk driver.`,
    action:
      result.clarity <= 2
        ? "Run a discovery session, confirm scope with stakeholders, and document requirements before full delivery begins."
        : result.clarity === 3
        ? "Refine the scope and confirm the key deliverables before the next phase starts."
        : "Maintain requirement sign-off and keep change requests controlled.",
  });

  // Higher dependency = higher risk
  drivers.push({
    key: "dependency",
    title: "External dependency",
    score: result.dependency,
    impact: getImpactLabel(result.dependency),
    explanation:
      result.dependency >= 4
        ? `Your dependency rating is ${result.dependency}/5, so reliance on external parties is a strong risk driver. Delays in approvals, suppliers, or third-party inputs may affect project delivery.`
        : result.dependency === 3
        ? "Your dependency rating is 3/5, which means external dependencies contribute moderately to project risk."
        : `Your dependency rating is ${result.dependency}/5, so external dependency is not currently a major risk driver.`,
    action:
      result.dependency >= 4
        ? "Identify critical third-party dependencies early, assign owners, and build fallback plans for delays."
        : result.dependency === 3
        ? "Track dependency owners and deadlines closely to reduce slippage."
        : "Continue monitoring external inputs, but this area appears relatively stable.",
  });

  // Lower expertise = higher risk
  const expertiseRisk = 6 - result.expertise;
  drivers.push({
    key: "expertise",
    title: "Team expertise",
    score: expertiseRisk,
    impact: getImpactLabel(expertiseRisk),
    explanation:
      result.expertise <= 2
        ? `Your team expertise rating is ${result.expertise}/5, so limited expertise is strongly increasing risk. This may reduce delivery speed, increase errors, and create reliance on a small number of experienced people.`
        : result.expertise === 3
        ? "Your team expertise rating is 3/5, so delivery capability is adequate but still a moderate source of risk."
        : `Your team expertise rating is ${result.expertise}/5, so limited expertise is not currently a major risk driver.`,
    action:
      result.expertise <= 2
        ? "Assign senior oversight, provide targeted support, and avoid concentrating critical work in one person."
        : result.expertise === 3
        ? "Review task allocation and ensure more complex work has enough support."
        : "Maintain current capability and monitor whether specialist support is needed later.",
  });

  // Sort highest risk drivers first
  return drivers.sort((a, b) => b.score - a.score);
}

function DriverCard({ driver }: { driver: Driver }) {
  const badgeBg =
    driver.impact === "High"
      ? "#FEE2E2"
      : driver.impact === "Moderate"
      ? "#FEF3C7"
      : "#E5E7EB";

  const badgeText =
    driver.impact === "High"
      ? "#991B1B"
      : driver.impact === "Moderate"
      ? "#92400E"
      : "#374151";

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#E5E7EB",
        borderRadius: 12,
        padding: 12,
        gap: 8,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Text style={{ fontWeight: "800", flex: 1 }}>{driver.title}</Text>
        <View
          style={{
            backgroundColor: badgeBg,
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
          }}
        >
          <Text style={{ color: badgeText, fontWeight: "700", fontSize: 12 }}>
            {driver.impact} impact
          </Text>
        </View>
      </View>

      <Text style={{ opacity: 0.8 }}>{driver.explanation}</Text>

      <Text>
        <Text style={{ fontWeight: "800" }}>Suggested action: </Text>
        {driver.action}
      </Text>
    </View>
  );
}

export default function Insights() {
  const { result, inputs } = useRisk();

  if (!result || !inputs) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "900" }}>Insights</Text>
        <Text style={{ marginTop: 10, opacity: 0.7 }}>
          Run a calculation first — then this tab will show your dashboard.
        </Text>
      </SafeAreaView>
    );
  }

  const maxDur = Math.max(1, result.pessimistic_days);
  const allDrivers = buildRiskDrivers(result);

  
  const topDrivers = allDrivers.filter((d) => d.score >= 3).slice(0, 3);
  const lowDrivers = allDrivers.filter((d) => d.score < 3);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <Text style={{ fontSize: 22, fontWeight: "900" }}>Insights Dashboard</Text>

     {/* Financial risk summary */}
<View
  style={{
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    gap: 12,
  }}
>
  <View
    style={{
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    }}
  >
    <Text style={{ fontSize: 16, fontWeight: "900", flex: 1 }}>
      Financial risk summary
    </Text>

    <View
      style={{
        backgroundColor:
          result.budget_status === "healthy"
            ? "#DCFCE7"
            : result.budget_status === "warning"
            ? "#FEF3C7"
            : "#FEE2E2",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
      }}
    >
      <Text
        style={{
          fontWeight: "700",
          fontSize: 12,
          color:
            result.budget_status === "healthy"
              ? "#166534"
              : result.budget_status === "warning"
              ? "#92400E"
              : "#991B1B",
        }}
      >
        Cost risk{" "}
        {result.budget_status === "healthy"
          ? "Low"
          : result.budget_status === "warning"
          ? "Moderate"
          : "High"}
      </Text>
    </View>
  </View>

  <View style={{ gap: 4 }}>
    <Text style={{ fontSize: 24, fontWeight: "900" }}>
      £{result.remaining.toFixed(2)}
    </Text>
    <Text style={{ opacity: 0.75 }}>
      remaining contingency ({result.remaining_percent.toFixed(2)}% of total budget)
    </Text>
  </View>

  <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
    {[
      { label: "Total budget", value: `£${result.overall.toFixed(2)}` },
      { label: "Available delivery budget", value: `£${result.available_budget.toFixed(2)}` },
      { label: "Project cost", value: `£${result.project.toFixed(2)}` },
      { label: "Remaining contingency", value: `£${result.remaining.toFixed(2)}` },
    ].map((item) => (
      <View
        key={item.label}
        style={{
          width: "50%",
          paddingHorizontal: 6,
          marginBottom: 12,
        }}
      >
        <View
          style={{
            borderWidth: 1,
            borderColor: "#E5E7EB",
            borderRadius: 12,
            padding: 10,
            gap: 4,
          }}
        >
          <Text style={{ fontSize: 12, opacity: 0.65 }}>{item.label}</Text>
          <Text style={{ fontSize: 16, fontWeight: "800" }}>{item.value}</Text>
        </View>
      </View>
    ))}
  </View>

  <Text style={{ opacity: 0.8, lineHeight: 20 }}>
    {result.budget_status === "healthy"
      ? "The project is currently operating within budget and retains a strong financial buffer, reducing immediate cost pressure."
      : result.budget_status === "warning"
      ? "The project remains within budget, but the available contingency is tightening and should be monitored closely."
      : "The project is under significant financial pressure and requires immediate attention to scope, cost, or funding."}
  </Text>

  <Text style={{ opacity: 0.65 }}>
    Internal team allocation: £{result.team_cut_amount.toFixed(2)} • Per person: £{result.per_person.toFixed(2)}
  </Text>
</View>

        {/* Risk meter */}
        <View style={{ padding: 14, borderWidth: 1, borderRadius: 14, gap: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: "900" }}>
            Overall Risk: {result.overall_risk_score}/5 ({result.risk_level})
          </Text>
          <Bar label="Risk meter" value={result.overall_risk_score} max={5} />
          <Text style={{ opacity: 0.7 }}>
            Contingency: {result.contingency_percent}% ({result.contingency_level}) • Schedule: {result.schedule_label}
          </Text>
        </View>

        {/* Factor ratings */}
        <View style={{ padding: 14, borderWidth: 1, borderRadius: 14, gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "900" }}>Factor ratings (1–5)</Text>
          <Bar label="Complexity" value={result.complexity} />
          <Bar label="Requirements clarity" value={result.clarity} helper="Lower clarity increases risk" />
          <Bar label="External dependency" value={result.dependency} />
          <Bar label="Team expertise" value={result.expertise} helper="Lower expertise increases risk" />
        </View>

        {/* Key risk drivers */}
        <View style={{ padding: 14, borderWidth: 1, borderRadius: 14, gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "900" }}>Key risk drivers</Text>

          {topDrivers.length > 0 ? (
            topDrivers.map((driver) => <DriverCard key={driver.key} driver={driver} />)
          ) : (
            <Text style={{ opacity: 0.75 }}>
              No single factor is currently a major driver of project risk. The overall risk appears relatively balanced across inputs.
            </Text>
          )}

          {lowDrivers.length > 0 ? (
            <Text style={{ opacity: 0.65 }}>
              Lower-impact factors are being monitored but are not currently major contributors to risk.
            </Text>
          ) : null}
        </View>

        {/* Schedule uncertainty */}
        <View style={{ padding: 14, borderWidth: 1, borderRadius: 14, gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "900" }}>Schedule uncertainty</Text>

          <Bar
            label="Optimistic"
            value={result.optimistic_days}
            max={maxDur}
            valueLabel={`${result.optimistic_days} day${result.optimistic_days === 1 ? "" : "s"}`}
          />

          <Bar
            label="Expected"
            value={result.expected_days}
            max={maxDur}
            valueLabel={`${result.expected_days} day${result.expected_days === 1 ? "" : "s"}`}
          />

          <Bar
            label="Pessimistic"
            value={result.pessimistic_days}
            max={maxDur}
            valueLabel={`${result.pessimistic_days} day${result.pessimistic_days === 1 ? "" : "s"}`}
          />

          <Text style={{ opacity: 0.7 }}>
            Estimated: {result.estimated_days} days • Deadline in: {result.days_to_deadline} days
          </Text>
        </View>

      {/* Risk justification */}
<View
  style={{
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    gap: 12,
  }}
>
  <Text style={{ fontSize: 16, fontWeight: "900" }}>Risk justification</Text>

  <Text style={{ opacity: 0.7 }}>
    These factors explain why the current risk level was assigned.
  </Text>

  {result.impact_reasons?.length ? (
    result.impact_reasons.map((reason, i) => (
      <View
        key={i}
        style={{
          borderWidth: 1,
          borderColor: "#E5E7EB",
          borderRadius: 12,
          padding: 12,
          backgroundColor: "#FFFFFF",
          gap: 6,
        }}
      >
        <Text style={{ fontWeight: "800" }}>Reason {i + 1}</Text>
        <Text style={{ opacity: 0.85, lineHeight: 20 }}>{reason}</Text>
      </View>
    ))
  ) : (
    <Text style={{ opacity: 0.7 }}>
      No specific justification is currently available.
    </Text>
  )}
   </View>
      </ScrollView>
    </SafeAreaView>
  );
}