export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Budget = 'free' | 'low' | 'flexible';

export interface PlanRequest {
  idea: string;
  level: Level;
  budget: Budget;
}

export interface ServiceItem { name: string; role: string; why: string }
export interface RoadmapPhase { phase: string; title: string; duration: string; tasks: string[] }
export interface RiskItem { risk: string; mitigation: string }

export interface Plan {
  title: string;
  tagline: string;
  summary: string;
  architecture: { pattern: string; services: ServiceItem[]; flow: string[] };
  roadmap: RoadmapPhase[];
  cost: { tier: 'free-tier' | 'low' | 'medium' | 'high'; monthlyEstimateUsd: string; notes: string };
  risks: RiskItem[];
  nextStep: string;
}
