import { ScannerModule } from "../core/pipeline";
import { ScanContext } from "../types/scan";


export class SSLScanner implements ScannerModule {


    name = "SSL/TLS Scanner";


    async execute(
        context: ScanContext
    ): Promise<void> {


        const url =
            new URL(
                context.target.url
            );



        if(
            url.protocol !== "https:"
        ){


            context.findings.push({

                id:
                "ssl-not-enabled",

                title:
                "HTTPS Not Enabled",

                description:
                "Target website is not using HTTPS encryption.",

                severity:
                "high",

                category:
                "ssl",

                evidence:
                "URL protocol: " + url.protocol,

                recommendation:
                "Enable HTTPS with a valid TLS certificate."

            });


            return;

        }



        try {


            const response =
                await fetch(
                    context.target.url,
                    {
                        method:"HEAD"
                    }
                );



            const serverHeader =
                response.headers.get(
                    "server"
                );



            if(serverHeader){


                console.log(
                    "[SSL] Server:",
                    serverHeader
                );


            }



            console.log(
                "[SSL] HTTPS enabled:",
                context.target.url
            );



        }
        catch(error){



            context.findings.push({

                id:
                "ssl-connection-failed",

                title:
                "TLS Connection Failed",

                description:
                "Unable to establish secure HTTPS connection.",

                severity:
                "high",

                category:
                "ssl",

                evidence:
                error instanceof Error
                ? error.message
                : "Unknown TLS error",

                recommendation:
                "Verify SSL certificate and HTTPS configuration."

            });


        }


    }


}
