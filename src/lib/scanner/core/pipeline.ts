import { ScanContext } from "../types/scan";


export interface ScannerModule {

    name:string;

    execute(
        context:ScanContext
    ):Promise<void>;

}



export class ScannerPipeline {


    private modules:ScannerModule[] = [];



    register(
        module:ScannerModule
    ){

        this.modules.push(
            module
        );

    }




    async execute(
        context:ScanContext
    ){


        for(
            const module of this.modules
        ){


            try{


                console.log(
                    "[Pipeline] Running:",
                    module.name
                );


                await module.execute(
                    context
                );


                console.log(
                    "[Pipeline] Completed:",
                    module.name
                );


            }
            catch(error){


                console.error(
                    "[Pipeline] Failed:",
                    module.name,
                    error
                );


            }


        }


    }


}
