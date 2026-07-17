import { Finding } from "../types/finding";


export interface SecurityReport {


    reportId:string;


    generatedAt:Date;


    target:{
        url:string;
    };


    summary:{
        totalFindings:number;
        riskLevel:string;
        riskScore:number;
    };


    findings:Finding[];


    recommendations:string[];


}
