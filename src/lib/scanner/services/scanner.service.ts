import { ScannerEngine } from "../core/engine";
import { ScanContext } from "../types/scan";
import { RiskEngine } from "../risk/risk.engine";
import { FindingNormalizer } from "../finding/normalizer";
import { ReportBuilder } from "../report/report.builder";


export class ScannerService {


    private risk =
        new RiskEngine();


    private normalizer =
        new FindingNormalizer();


    private reportBuilder =
        new ReportBuilder();



    constructor(
        private readonly engine:ScannerEngine
    ){}



    async scan(
        url:string
    ){


        const context:ScanContext = {


            target:{
                url
            },


            startedAt:
                new Date(),


            findings:[]

        };



        await this.engine.run(
            context
        );



        const findings =
            this.normalizer.normalize(
                context.findings
            );



        const risk =
            this.risk.calculate(
                findings
            );



        const report =
            this.reportBuilder.build(
                url,
                findings,
                risk
            );



        return {


            success:true,


            report


        };


    }


}
