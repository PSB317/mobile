import React from "react";
import { SafeAreaView, Text, View, ScrollView, Button, Alert } from "react-native";
import * as Sharing from "expo-sharing";
import { useRisk } from "./RiskContext"; 

export default function ExportTab() {
  const { exports } = useRisk();

  const handleShare = async (uri?: string) => {
    try {
      if (!uri) {
        Alert.alert("File missing", "No local file is available for this export.");
        return;
      }

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert("Sharing unavailable", "Sharing is not available on this device.");
        return;
      }

      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("Share failed", "Could not share the Excel file.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 22, fontWeight: "700" }}>Export</Text>

        {exports.length === 0 ? (
          <Text>No exported files yet.</Text>
        ) : (
          exports.map((item) => (
            <View
              key={item.id}
              style={{
                borderWidth: 1,
                borderRadius: 10,
                padding: 12,
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700" }}>{item.title}</Text>
              <Text>File: {item.excel_file}</Text>
              <Text>Risk: {item.overall_risk_score}/5</Text>
              <Text>Level: {item.risk_level}</Text>
              <Text>Probability: {item.probability_score}</Text>
              <Text>Impact: {item.impact_score}</Text>
              <Text style={{ opacity: 0.7 }}>
                Created: {new Date(item.createdAt).toLocaleString()}
              </Text>

              <Button
                title="Share Excel File"
                onPress={() => handleShare(item.local_file_uri)}
              />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}