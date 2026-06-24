export type LoadStatus = "balanced" | "moderate" | "overload";

export interface WorkloadPoint {
  employeeId: string;
  name: string;
  totalTasks: number;
  estimatedHours: number;
  workedHours: number;
  capacityHours: number;
  occupationPct: number;
  availableHours: number;
  status: LoadStatus;
  overload: boolean;
}

export interface WorkloadBalance {
  points: WorkloadPoint[];
  averageOccupationPct: number;
  teamCapacityHours: number;
  teamWorkedHours: number;
  overloadedCount: number;
}
