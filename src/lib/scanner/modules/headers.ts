import { ScannerModule } from "../core/pipeline";
import { ScanContext } from "../types/scan";
import { Severity } from "../types/finding";


const SECURITY_HEADERS: {
    name:string;
    title:string;
    severity:Severity;
}[] = [

    {
        name:"strict-transport-security",
        title:"Missing HSTS Header",
        severity:"medium"
    },

    {
        name:"content-security-policy",
        title:"Missing Content Security Policy",
        severity:"high"
    },

    {
        name:"x-frame-options",
        title:"Missing X-Frame-Options",
        severity:"medium"
    },

    {
        name:"x-content-type-options",
        title:"Missing X-Content-Type-Options",
        severity:"low"
    },

    {
        name:"referrer-policy",
        title:"Missing Referrer Policy",
        severity:"low"
    }

];


export class HeadersScanner implements ScannerModule {


    name = "Security Headers Scanner";


    async execute(
        context:ScanContext
    ):Promise<void>{


        const response =
            await fetch(
                context.target.url
            );


        for(const header of SECURITY_HEADERS){


            const value =
                response.headers.get(
                    header.name
                );


            if(!value){


                context.findings.push({

                    id:
                    "missing-" + header.name,

                    title:
                    header.title,

                    description:
                    header.name +
                    " header is missing",

                    severity:
                    header.severity,

                    category:
                    "Security Headers",

                    evidence:
                    "Header not present",

                    recommendation:
                    "Configure " +
                    header.name

                });


            }


        }


    }


}
