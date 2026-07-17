import { Finding } from "../types/finding";


export class ReportEngine {


    generate(
        findings: Finding[],
        risk:any
    ){

        const recommendations =
            findings.map(
                finding => ({
                    issue:
                        finding.title,

                    severity:
                        finding.severity,

                    action:
                        finding.recommendation
                })
            );


        return {

            summary:
                this.summary(risk),


            securityScore:
                Math.max(
                    0,
                    100 - risk.score
                ),


            riskLevel:
                risk.level,


            findingsCount:
                findings.length,


            recommendations

        };

    }



    private summary(
        risk:any
    ){

        if(risk.level==="HIGH")
        {
            return "Immediate security improvements recommended.";
        }


        if(risk.level==="MEDIUM")
        {
            return "Security improvements should be planned.";
        }


        return "Security posture looks healthy.";

    }


}
