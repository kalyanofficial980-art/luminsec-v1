import { Finding } from "./finding";


export type ScanStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";


export interface ScanTarget {

  url:string;

}


export interface ScanContext {

  target:ScanTarget;

  startedAt:Date;

  findings:Finding[];

}


export interface ScanResult {

  status:ScanStatus;

  findings:Finding[];

  score:number;

  completedAt:Date;

}
