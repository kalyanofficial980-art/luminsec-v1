import { lookup } from "dns/promises";


function isPrivateIPv4(ip:string){

    const parts =
        ip.split(".").map(Number);


    if(parts.length !== 4){
        return false;
    }


    const [
        a,
        b
    ] = parts;


    return (

        a === 127 ||

        a === 10 ||

        a === 0 ||

        (a === 192 && b === 168) ||

        (a === 172 && b >= 16 && b <=31)

    );

}



export async function validateScanUrl(
    input:string
){

    const url =
        new URL(input);



    if(
        url.protocol !== "http:" &&
        url.protocol !== "https:"
    ){

        throw new Error(
            "Only HTTP/HTTPS URLs allowed"
        );

    }



    const hostname =
        url.hostname;



    if(
        hostname === "localhost" ||
        hostname === "::1"
    ){

        throw new Error(
            "Private host blocked"
        );

    }



    const addresses =
        await lookup(
            hostname,
            {
                all:true
            }
        );



    for(
        const address of addresses
    ){

        if(
            isPrivateIPv4(
                address.address
            )
        ){

            throw new Error(
                "Private IP blocked"
            );

        }

    }


    return url;

}
