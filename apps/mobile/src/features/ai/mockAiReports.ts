import type { AIReport } from "@/types/ai";

export const mockAiReports: AIReport[] = [
  {
    id: "ai-report-weekly-1",
    createdAt: "2026-06-04T09:00:00.000Z",
    title: "Weekly Training Review",
    summary:
      "Strength work is trending well, especially on upper body compounds. Lower body volume is solid, but fatigue is likely building around hip hinge work.",
    recommendations: [
      "Keep bench top sets around RPE 8 for one more week before adding load.",
      "Add one lighter hamstring accessory slot instead of another heavy hinge.",
      "Use a simple back-off set on squats to build volume without forcing max effort.",
    ],
    warnings: [
      "Deadlift intensity and Romanian deadlift volume are close together this week.",
    ],
    confidenceScore: 0.78,
  },
  {
    id: "ai-report-recovery-1",
    createdAt: "2026-05-30T10:15:00.000Z",
    title: "Recovery Check",
    summary:
      "Recent sessions show good consistency, but accessory work is dropping off late in workouts.",
    recommendations: [
      "Move the most important accessory earlier in the session.",
      "Cap secondary work at RPE 8 when sleep or schedule pressure is high.",
    ],
    warnings: [],
    confidenceScore: 0.71,
  },
];
