import { ScannerPipeline } from "./pipeline";
import { ScanContext } from "../types/scan";


export class ScannerEngine {


    constructor(
        private readonly pipeline: ScannerPipeline
    ){}



    async run(
        context: ScanContext
    ){

        await this.pipeline.execute(
            context
        );

    }


}
