export type AIReport = {
  id: string;
  createdAt: string;
  title: string;
  summary: string;
  recommendations: string[];
  warnings: string[];
  confidenceScore: number;
};
