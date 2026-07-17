import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createScannerService } from "@/lib/scanner/services/factory";


const ScanRequestSchema = z.object({

    url: z
        .string()
        .url()

});



export async function POST(
    request: NextRequest
){

    try {


        const body =
            await request.json();



        const validation =
            ScanRequestSchema.safeParse(
                body
            );



        if(!validation.success){

            return NextResponse.json(
                {
                    error:"Invalid scan request"
                },
                {
                    status:400
                }
            );

        }



        const scanner =
            createScannerService();



        const result =
            await scanner.scan(
                validation.data.url
            );



        return NextResponse.json(
            result,
            {
                status:200
            }
        );



    }
    catch(error){


        console.error(
            "[SCAN API ERROR]",
            error
        );



        return NextResponse.json(

            {
                error:
                "Scanner failed"
            },

            {
                status:500
            }

        );

    }

}
