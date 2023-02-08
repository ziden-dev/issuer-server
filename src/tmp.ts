import { GlobalVariables } from "./common/config/global.js";
import { claim as zidenjsClaim, utils as zidenjsUtils } from "zidenjs";
import { PASSWORD } from "./common/config/secrets.js";
import axios from "axios";
import { readFileSync, writeFileSync } from "fs";
import { getCountryCode, serializaData } from "./util/utils.js";


async function test() {
    await GlobalVariables.init();
    // const pass = "issuer-v2-dev"
    // const x = zidenjsUtils.privateKeyFromPassword(pass);
    // console.log(zidenjsUtils.bufferToHex(x));



    const pi = "1122334455";
    const pihex = zidenjsUtils.hexToBuffer(pi, 32);
    console.log(GlobalVariables.F.toObject(GlobalVariables.eddsa.prv2pub(pihex)[0]));

    console.log(GlobalVariables.F.toObject(GlobalVariables.eddsa.prv2pub(pihex)[1]));

    // const pri = "9988771111";
    // const challenge = "4677482851936488611498746715952887527835261778658872395323764468771116433629";
    // let priBuf = zidenjsUtils.hexToBuffer(pri, 32);

    // const signChallenge = await zidenjsClaim.authClaim.signChallenge(priBuf, BigInt(challenge));
    // console.log(serializaData(signChallenge));
}

// async function test() {
//     const x = await urltoFile('data:text/plain;base64,aGVsbG8gd29ybGQ=', 'hello.txt','jpg/plain')
//     // .then(function(file){ console.log(file);});
//     // console.log(x);
// }

test();
// test2();