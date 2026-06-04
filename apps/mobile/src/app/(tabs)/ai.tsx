import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Header } from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { typography } from "@/constants/typography";
import { mockAiReports } from "@/features/ai/mockAiReports";
import type { AIReport } from "@/types/ai";

export default function AIScreen() {
  const [reports, setReports] = useState<AIReport[]>(mockAiReports);
  const [isGenerating, setIsGenerating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestReport = reports[0];
  const reportHistory = reports.slice(1);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleGenerateReview() {
    setIsGenerating(true);

    timeoutRef.current = setTimeout(() => {
      const generatedReport: AIReport = {
        ...mockAiReports[0],
        id: `ai-report-generated-${Date.now()}`,
        createdAt: new Date().toISOString(),
        title: "Generated 4-Week Review",
      };

      setReports((currentReports) => [generatedReport, ...currentReports]);
      setIsGenerating(false);
    }, 900);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header title="AI" subtitle="Review training feedback without turning this into chat." />

        <Button disabled={isGenerating} onPress={handleGenerateReview}>
          Generate 4-Week Review
        </Button>

        {isGenerating ? (
          <Card title="Generating">
            <LoadingState message="Reviewing local training history..." />
          </Card>
        ) : null}

        <AIReportCard report={latestReport} title="Latest Report" />

        <Card title="Missing Data">
          <Text style={styles.bodyText}>
            Sleep, soreness, and readiness are not tracked yet, so recovery advice stays conservative.
          </Text>
        </Card>

        <Card title="Report History">
          {reportHistory.length === 0 ? (
            <Text style={styles.bodyText}>No older reports yet.</Text>
          ) : (
            <View style={styles.historyList}>
              {reportHistory.map((report) => (
                <View key={report.id} style={styles.historyItem}>
                  <Text style={styles.historyTitle}>{report.title}</Text>
                  <Text style={styles.mutedText}>{formatReportDate(report.createdAt)}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

type AIReportCardProps = {
  report: AIReport;
  title: string;
};

function AIReportCard({ report, title }: AIReportCardProps) {
  return (
    <Card title={title}>
      <Text style={styles.historyTitle}>{report.title}</Text>
      <Text style={styles.mutedText}>{formatReportDate(report.createdAt)}</Text>
      <Text style={styles.bodyText}>{report.summary}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommendations</Text>
        {report.recommendations.map((recommendation) => (
          <Text key={recommendation} style={styles.bodyText}>
            {recommendation}
          </Text>
        ))}
      </View>

      {report.warnings.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Warnings</Text>
          {report.warnings.map((warning) => (
            <Text key={warning} style={styles.warningText}>
              {warning}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={styles.mutedText}>
        Confidence {Math.round(report.confidenceScore * 100)}%
      </Text>
    </Card>
  );
}

function formatReportDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  bodyText: {
    color: colors.text,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  warningText: {
    color: colors.danger,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.caption,
    textTransform: "uppercase",
  },
  historyList: {
    gap: spacing.md,
  },
  historyItem: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  historyTitle: {
    color: colors.text,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    lineHeight: typography.lineHeights.body,
  },
});
