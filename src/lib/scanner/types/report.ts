import { Finding } from "./finding";


export interface ScanReport {

  target:string;

  generatedAt:Date;

  findings:Finding[];

  score:number;

}
