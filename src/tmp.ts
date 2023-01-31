import { GlobalVariables } from "./common/config/global.js";
import { claim as zidenjsClaim, utils as zidenjsUtils } from "zidenjs";
import { PASSWORD } from "./common/config/secrets.js";
import axios from "axios";
import { readFileSync, writeFileSync } from "fs";
import { getCountryCode, serializaData } from "./util/utils.js";


async function test() {
    await GlobalVariables.init();
    // const pass = "hihahiha"
    // const x = zidenjsUtils.privateKeyFromPassword(pass);
    // console.log(zidenjsUtils.bufferToHex(x));

    const pi = "1010111";
    const pihex = zidenjsUtils.hexToBuffer(pi, 32);
    console.log(GlobalVariables.F.toObject(GlobalVariables.eddsa.prv2pub(pihex)[0]));

    console.log(GlobalVariables.F.toObject(GlobalVariables.eddsa.prv2pub(pihex)[1]));

    // const pri = "6869686168696861";
    const challenge = "5377096016529929857332886599134366103633590830591671313185393244392261953836";
    // let priBuf = zidenjsUtils.hexToBuffer(pri, 32);

    const signChallenge = await zidenjsClaim.authClaim.signChallenge(pihex, BigInt(challenge));
    console.log(serializaData(signChallenge));
}

// async function test() {
//     const x = await urltoFile('data:text/plain;base64,aGVsbG8gd29ybGQ=', 'hello.txt','jpg/plain')
//     // .then(function(file){ console.log(file);});
//     // console.log(x);
// }

test();
// test2();