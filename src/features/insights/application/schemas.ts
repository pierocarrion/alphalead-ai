import { z } from "zod";

export const teamInsightsFiltersSchema = z
  .object({
    team: z.string().optional(),
    project: z.string().optional(),
    position: z.string().optional(),
    seniority: z.string().optional(),
    since: z.string().optional(),
    until: z.string().optional(),
    sentiment: z.enum(["positive", "neutral", "risk"]).optional(),
    risk: z.enum(["low", "moderate", "high"]).optional(),
    skills: z.array(z.string()).optional(),
  })
  .optional();

export type TeamInsightsFiltersInput = z.infer<typeof teamInsightsFiltersSchema>;

export const granularitySchema = z.enum(["week", "month", "quarter", "year"]);

export const exportFormatSchema = z.enum(["csv", "json", "pdf"]);
