import { claim as zidenjsClaim, witness as zidenjsWitness, utils as zidenjsUtils } from "zidenjs";
import { GlobalVariables as GlobalVariables } from "../common/config/global.js";
import { ClaimStatus } from "../common/enum/EnumType.js";
import Claim from "../models/Claim.js";
import { getPublishAndRevkeChallenge, getPublishChallenge, getRevokeChallenge } from "./Challenge.js";
import { getIssuer } from "./Issuer.js";
import { backupLastState, cloneDb, closeLevelDb, restoreDb } from "./LevelDbManager.js";
import { checkLockTreeState, getTreeState, saveTreeState } from "./TreeState.js";
import fs from "fs-extra";
import { execSync } from "child_process";
import { ethers } from "ethers"
import { serializaData } from "../util/utils.js";
import { RPC_PROVIDER, STATE_ADDRESS } from "../common/config/secrets.js";

export async function publishOnly(signature:  zidenjsClaim.authClaim.SignedChallenge, issuerId: string) {    
    const claims = await Claim.find({"status": ClaimStatus.PENDING, "issuerId": issuerId});
    const claimIds: Array<string> = claims.map(claim => {
        return claim.id!;
    });
    if (claimIds.length != 0) {
        return;
    }

    const currentChallange = await getPublishChallenge(claimIds, issuerId);
    if (currentChallange != signature.challenge) {
        throw("signed challenge does not match current challenge");
    }

    const hihv: [ArrayLike<number>, ArrayLike<number>][] = claims.map(claim => {
        return [GlobalVariables.F.e(claim.hi!), GlobalVariables.F.e(claim.hv!)];    
    });

    const result = await stateTransition(issuerId, signature, hihv, []);
    if (result) {
        for (let i = 0; i < claims.length; i++) {
            claims[i].status = ClaimStatus.ACTIVE;
            await claims[i].save();
        }
    }
}

export async function revokeOnly(signature:  zidenjsClaim.authClaim.SignedChallenge, issuerId: string) {
    const claims = await Claim.find({"status": ClaimStatus.PENDING_REVOKE, "issuerId": issuerId});
    const claimIds: Array<string> = claims.map(claim => {
        return claim.id!;
    });

    if (claimIds.length == 0) {
        return;
    }

    const currentChallange = await getRevokeChallenge(claimIds, issuerId);
    if (currentChallange != signature.challenge) {
        throw("signed challenge does not match current challenge");
    }

    const revNonces: Array<BigInt> = [];
    claims.forEach(claim => {
        if (claim.revNonce) {
            revNonces.push(BigInt(claim.revNonce));
        }
    })

    const result = await stateTransition(issuerId, signature, [], revNonces);
    if (result) {
        for (let i = 0; i < claimIds.length; i++) {
            claims[i].status = ClaimStatus.REVOKED;
            await claims[i].save();
        }
    }     
}

export async function publishAndRevoke(signature:  zidenjsClaim.authClaim.SignedChallenge, issuerId: string) {
    const claimsPublish = await Claim.find({"status": ClaimStatus.PENDING, "issuerId": issuerId});
    const claimIdsPublish: Array<string> = claimsPublish.map(claim => {
        return claim.id!;
    });

    const claimsRevoke = await Claim.find({"status": ClaimStatus.PENDING_REVOKE, "issuerId": issuerId});
    const claimIdsRevoke: Array<string> = claimsRevoke.map(claim => {
        return claim.id!;
    });

    if (claimIdsPublish.length == 0 && claimIdsRevoke.length == 0) {
        return;
    }

    const currentChallange = await getPublishAndRevkeChallenge(claimIdsPublish, claimIdsRevoke,issuerId);
    if (currentChallange != signature.challenge) {
        throw("signed challenge does not match current challenge");
    }

    const hihv: [ArrayLike<number>, ArrayLike<number>][] = claimsPublish.map(claim => {
        return [GlobalVariables.F.e(claim.hi!), GlobalVariables.F.e(claim.hv!)];    
    });
    const revNonces: Array<BigInt> = [];
    claimsRevoke.forEach(claim => {
        if (claim.revNonce) {
            revNonces.push(BigInt(claim.revNonce));
        }
    })

    const result = await stateTransition(issuerId, signature, hihv, revNonces);
    if (result) {
        for (let i = 0; i < claimsPublish.length; i++) {
            claimsPublish[i].status = ClaimStatus.ACTIVE;
            await claimsPublish[i].save();
        }
        for (let i = 0; i < claimsRevoke.length; i++) {
            claimsRevoke[i].status = ClaimStatus.REVOKED;
            await claimsRevoke[i].save();
        }
    }
}

export async function stateTransition(issuerId: string, signature:  zidenjsClaim.authClaim.SignedChallenge, hihvBatch: Array<[ArrayLike<number>, ArrayLike<number>]>, revNonces: Array<BigInt>) {
    const issuer = await getIssuer(issuerId);
    await cloneDb(issuer.pathDb!);
    const authClaim = await zidenjsClaim.authClaim.newAuthClaimFromPublicKey(BigInt(issuer.pubkeyX!), BigInt(issuer.pubkeyY!));
    const {claimsDb, revocationDb, rootsDb, issuerTree} = await getTreeState(issuerId);
    try {
        const stateTransitionInputs = await zidenjsWitness.stateTransition.stateTransitionWitnessWithHiHvWithSignature(
            signature,
            authClaim,
            issuerTree,
            hihvBatch,
            revNonces
        );

        // Generate proof
        const statePath = "build/stateTransition"
        const rapidSnarkPath = "build/rapidSnark"
        fs.writeFileSync(`${statePath}/input.json`, (serializaData(stateTransitionInputs)));
        // execSync(`npx snarkjs calculatewitness ${statePath}/stateTransition.wasm ${statePath}/input.json ${statePath}/witness.wtns`)
        // execSync(`npx snarkjs groth16 prove ${statePath}/state_final.zkey ${statePath}/witness.wtns ${statePath}/proof.json ${statePath}/public.json`)
        execSync(`${statePath}/stateTransition ${statePath}/input.json ${statePath}/witness.wtns`);
        execSync(`${rapidSnarkPath}/prover ${statePath}/state_final.zkey ${statePath}/witness.wtns ${statePath}/proof.json ${statePath}/public.json`)

        // Prepare calldata for transitState 
        const out = execSync(`snarkjs zkey export soliditycalldata ${statePath}/public.json ${statePath}/proof.json`, { "encoding": "utf-8" }).toString().split(',').map(e => {
            return e.replace(/([\[\]\s\"])/g, "")
        })
        console.log(out);

        let a, b = [], c, publicSig;
        a = out.slice(0, 2).map(e => BigInt(e));
        b[0] = out.slice(2, 4).map(e => BigInt(e));
        b[1] = out.slice(4, 6).map(e => BigInt(e));
        c = out.slice(6, 8).map(e => BigInt(e));
        publicSig = out.slice(8, out.length).map(e => BigInt(e));

        const provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDER);
        const secret = JSON.parse(fs.readFileSync("secret.json", "utf-8"))
        const wallet = new ethers.Wallet(secret.pk, provider);
        const stateABI = JSON.parse(fs.readFileSync("build/abis/State.json", "utf-8"))
        const state = new ethers.Contract(STATE_ADDRESS, stateABI, provider);

        const transitState = await state.connect(wallet).functions.transitState(publicSig[0], publicSig[1], publicSig[2], publicSig[3], a, b, c, { gasLimit: 3000000 });
        const tx = await transitState.wait();
        console.log(tx.events[0].event == "StateUpdated");
        if (tx.events[0].event == "StateUpdated") {
            await saveTreeState(issuerTree);
            await backupLastState(issuer.pathDb!);
            await closeLevelDb(claimsDb, revocationDb, rootsDb);
            return true;
        } else {
            await restoreDb(issuer.pathDb!);
            await closeLevelDb(claimsDb, revocationDb, rootsDb);
            return false;
        }
    } catch (err: any) {
        await restoreDb(issuer.pathDb!);
        await closeLevelDb(claimsDb, revocationDb, rootsDb);
        console.log(err);
        return false;
    }
}