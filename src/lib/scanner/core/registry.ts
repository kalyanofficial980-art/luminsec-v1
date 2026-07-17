import { ScannerModule } from "./pipeline";


export class ScannerRegistry {


    private modules: ScannerModule[] = [];


    register(
        module: ScannerModule
    ) {

        this.modules.push(module);

    }


    getModules(): ScannerModule[] {

        return this.modules;

    }


}
