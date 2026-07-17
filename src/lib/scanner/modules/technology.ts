import { ScannerModule } from "../core/pipeline";
import { ScanContext } from "../types/scan";


const TECHNOLOGY_SIGNATURES = [
    {
        name:"nginx",
        header:"server"
    },
    {
        name:"cloudflare",
        header:"server"
    },
    {
        name:"nextjs",
        header:"x-powered-by"
    }
];


export class TechnologyScanner implements ScannerModule {


    name = "Technology Fingerprinting Scanner";


    async execute(
        context:ScanContext
    ):Promise<void>{


        const response =
            await fetch(
                context.target.url,
                {
                    method:"HEAD"
                }
            );


        for(
            const tech of TECHNOLOGY_SIGNATURES
        ){


            const value =
                response.headers.get(
                    tech.header
                );


            if(value?.toLowerCase().includes(
                tech.name
            )){


                context.findings.push({

                    id:
                    "technology-" + tech.name,

                    title:
                    "Technology detected: " + tech.name,

                    description:
                    "Target technology fingerprint detected.",

                    severity:
                    "info",

                    category:
                    "technology",

                    evidence:
                    `${tech.header}: ${value}`,

                    recommendation:
                    "Keep technology versions updated."

                });


            }


        }


    }


}
