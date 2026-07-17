export type Severity =
  | "info"
  | "low"
  | "medium"
  | "high"
  | "critical";


export interface Finding {

  id: string;

  title: string;

  description: string;

  severity: Severity;

  category: string;

  evidence?: string;

  recommendation?: string;

}
