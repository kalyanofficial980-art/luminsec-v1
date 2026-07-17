import { ScannerPipeline } from "./pipeline";
import { ScannerRegistry } from "./registry";

import { HttpScanner } from "../modules/http";
import { HeadersScanner } from "../modules/headers";
import { CookiesScanner } from "../modules/cookies";
import { SSLScanner } from "../modules/ssl";
import { TechnologyScanner } from "../modules/technology";


export function createScannerPipeline(){


    const registry =
        new ScannerRegistry();


    registry.register(
        new HttpScanner()
    );


    registry.register(
        new HeadersScanner()
    );


    registry.register(
        new CookiesScanner()
    );


    registry.register(
        new SSLScanner()
    );


    registry.register(
        new TechnologyScanner()
    );


    const pipeline =
        new ScannerPipeline();


    for(const module of registry.getModules()){

        pipeline.register(module);

    }


    return pipeline;

}
