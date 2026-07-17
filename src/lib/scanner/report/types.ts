import { Finding } from "../types/finding";


export interface SecurityReport {


    reportId:string;


    generatedAt:string;


    target:{
        url:string;
    };


    summary:{
        totalFindings:number;
        riskLevel:string;
        riskScore:number;
    };


    findings:Finding[];


    recommendations:
    ReportRecommendation[];

}



export interface ReportRecommendation {


    findingId:string;


    severity:string;


    action:string;


    category:string;


}

