import { Finding } from "../types/finding";


export type RiskLevel =
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL";


export interface RiskScore {

    score:number;

    level:RiskLevel;

    critical:number;

    high:number;

    medium:number;

    low:number;

}



export class RiskEngine {


    calculate(
        findings:Finding[]
    ):RiskScore {


        let penalty = 0;


        let critical = 0;
        let high = 0;
        let medium = 0;
        let low = 0;



        for(const finding of findings){


            switch(finding.severity){


                case "critical":
                    penalty += 40;
                    critical++;
                    break;


                case "high":
                    penalty += 20;
                    high++;
                    break;


                case "medium":
                    penalty += 10;
                    medium++;
                    break;


                case "low":
                    penalty += 5;
                    low++;
                    break;


            }


        }



        const score =
            Math.max(
                0,
                100 - penalty
            );



        let level:RiskLevel;



        if(score >= 90){

            level="LOW";

        }
        else if(score >=70){

            level="MEDIUM";

        }
        else if(score >=40){

            level="HIGH";

        }
        else{

            level="CRITICAL";

        }



        return {

            score,

            level,

            critical,

            high,

            medium,

            low

        };


    }


}
