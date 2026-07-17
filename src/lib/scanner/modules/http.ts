import { ScannerModule } from "../core/pipeline";
import { ScanContext } from "../types/scan";
import { validateScanUrl } from "../utils/url-security";


export class HttpScanner implements ScannerModule {

    name = "HTTP Scanner";


    async execute(
        context: ScanContext
    ): Promise<void> {


        const url =
            await validateScanUrl(
                context.target.url
            );


        const controller =
            new AbortController();


        const timeout =
            setTimeout(
                () => controller.abort(),
                10000
            );


        try {


            const response =
                await fetch(
                    url,
                    {
                        method: "GET",
                        redirect: "follow",
                        signal: controller.signal
                    }
                );


            clearTimeout(timeout);


            console.log(
                "[HTTP]",
                response.status,
                url.toString()
            );


            if(response.status >= 500){

                context.findings.push({

                    id: "http-server-error",

                    title:
                        "Server returned error status",

                    description:
                        "Target server returned a 5xx HTTP response.",

                    severity:
                        "medium",

                    category:
                        "availability",

                    evidence:
                        "HTTP status: " + response.status,

                    recommendation:
                        "Investigate server errors and improve reliability."

                });

            }


            if(!response.headers.has("content-security-policy")){

                context.findings.push({

                    id: "missing-csp",

                    title:
                        "Missing Content Security Policy",

                    description:
                        "The website does not define a Content Security Policy header.",

                    severity:
                        "medium",

                    category:
                        "headers",

                    evidence:
                        "Content-Security-Policy header missing",

                    recommendation:
                        "Configure a strict CSP policy."

                });

            }


        }
        catch(error){


            clearTimeout(timeout);


            context.findings.push({

                id: "http-fetch-failed",

                title:
                    "HTTP request failed",

                description:
                    "Scanner could not complete HTTP request.",

                severity:
                    "high",

                category:
                    "connectivity",

                evidence:
                    error instanceof Error
                    ? error.message
                    : "Unknown error",

                recommendation:
                    "Verify URL availability."

            });


        }


    }


}
