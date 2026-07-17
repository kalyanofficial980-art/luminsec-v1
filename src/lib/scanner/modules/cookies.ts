import { ScannerModule } from "../core/pipeline";
import { ScanContext } from "../types/scan";


export class CookiesScanner implements ScannerModule {


    name = "Cookies Scanner";


    async execute(
        context: ScanContext
    ): Promise<void> {


        const response =
            await fetch(
                context.target.url
            );


        const cookies =
            response.headers.get(
                "set-cookie"
            );


        if(!cookies){

            return;

        }


        const cookieList =
            cookies.split(",");


        for(const cookie of cookieList){


            const lower =
                cookie.toLowerCase();



            if(!lower.includes("secure")){


                context.findings.push({

                    id:
                    "cookie-missing-secure",

                    title:
                    "Cookie Missing Secure Flag",

                    description:
                    "Cookie is not protected with Secure attribute.",

                    severity:
                    "medium",

                    category:
                    "cookies",

                    evidence:
                    cookie,

                    recommendation:
                    "Enable Secure flag for cookies."

                });

            }



            if(!lower.includes("httponly")){


                context.findings.push({

                    id:
                    "cookie-missing-httponly",

                    title:
                    "Cookie Missing HttpOnly Flag",

                    description:
                    "Cookie can potentially be accessed by client-side scripts.",

                    severity:
                    "high",

                    category:
                    "cookies",

                    evidence:
                    cookie,

                    recommendation:
                    "Enable HttpOnly flag."

                });

            }



            if(
                !lower.includes("samesite")
            ){


                context.findings.push({

                    id:
                    "cookie-missing-samesite",

                    title:
                    "Cookie Missing SameSite Attribute",

                    description:
                    "Cookie does not define SameSite protection.",

                    severity:
                    "low",

                    category:
                    "cookies",

                    evidence:
                    cookie,

                    recommendation:
                    "Configure SameSite=Lax or Strict."

                });


            }


        }


    }


}
