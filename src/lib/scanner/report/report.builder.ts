import { Finding } from "../types/finding";
import { SecurityReport } from "./report.types";


export class ReportBuilder {


    build(
        url:string,
        findings:Finding[],
        risk:{
            score:number;
            level:string;
        }
    ):SecurityReport{


        const recommendations =
            Array.from(
                new Set(
                    findings.map(
                        finding =>
                            finding.recommendation ??
                            "Review and remediate this security issue."
                    )
                )
            );



        return {


            reportId:
                "scan_" +
                Date.now(),


            generatedAt:
                new Date(),


            target:{
                url
            },


            summary:{


                totalFindings:
                    findings.length,


                riskLevel:
                    risk.level,


                riskScore:
                    risk.score

            },


            findings,


            recommendations


        };


    }


}


