export type GrowthGranularity = "week" | "month" | "quarter" | "year";

export interface GrowthPoint {
  date: string;
  growthIndex: number;
  coursesCompleted: number;
  newSkills: number;
  certifications: number;
  sustainableProductivity: number;
  participation: number;
}

export interface TeamGrowth {
  granularity: GrowthGranularity;
  points: GrowthPoint[];
  current: number;
  previous: number;
  deltaPct: number;
}
