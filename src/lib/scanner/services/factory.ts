import { ScannerPipeline } from "../core/pipeline";
import { ScannerRegistry } from "../core/registry";
import { ScannerEngine } from "../core/engine";
import { ScannerService } from "./scanner.service";

import { HttpScanner } from "../modules/http";
import { HeadersScanner } from "../modules/headers";


export function createScannerService(){


    const registry =
        new ScannerRegistry();



    registry.register(
        new HttpScanner()
    );


    registry.register(
        new HeadersScanner()
    );



    const pipeline =
        new ScannerPipeline();



    for(
        const module of registry.getModules()
    ){

        pipeline.register(
            module
        );

    }



    const engine =
        new ScannerEngine(
            pipeline
        );



    return new ScannerService(
        engine
    );


}
