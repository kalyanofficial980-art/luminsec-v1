import { Finding } from "../types/finding";


const NORMALIZATION_MAP: Record<string,string> = {

    "missing-content-security-policy":
        "missing-csp",

    "missing-strict-transport-security":
        "missing-hsts",

    "missing-x-frame-options":
        "missing-clickjacking-protection"

};


const severityWeight = {

    info:1,
    low:2,
    medium:3,
    high:4,
    critical:5

};



export class FindingNormalizer {



    normalize(
        findings: Finding[]
    ): Finding[] {


        const map =
            new Map<string,Finding>();



        for(const finding of findings){


            const normalizedId =
                NORMALIZATION_MAP[finding.id]
                ??
                finding.id;



            const existing =
                map.get(normalizedId);



            if(!existing){


                map.set(
                    normalizedId,
                    {
                        ...finding,
                        id:normalizedId
                    }
                );


                continue;

            }



            const currentSeverity =
                severityWeight[
                    finding.severity
                ];



            const existingSeverity =
                severityWeight[
                    existing.severity
                ];



            if(
                currentSeverity >
                existingSeverity
            ){

                existing.severity =
                    finding.severity;

            }



            existing.evidence =
                [
                    existing.evidence,
                    finding.evidence
                ]
                .filter(Boolean)
                .join("; ");

        }



        return Array.from(
            map.values()
        );


    }


}
