import { v4 } from "uuid";
import { claim as zidenjsClaim, witness as zidenjsWitness } from "zidenjs";
import { GlobalVariables } from "../common/config/global.js";
import { ClaimStatus, ProofType } from "../common/enum/EnumType.js";
import Claim from "../models/Claim.js";
import { serializaData } from "../util/utils.js";
import { closeLevelDb } from "./LevelDbManager.js";
import { getTreeState, saveTreeState } from "./TreeState.js";

export async function saveClaim(claim: zidenjsClaim.entry.Entry, schemaHash: string, userId: string, issuerId: string, schemaRegistryId: string) {
    const claimId = v4();
    const lastClaim = await Claim.find({userId: userId, schemaHash: schemaHash}).limit(1).sort({"version": -1});
    let versionClaim = 0;
    if (lastClaim.length != 0) {
        versionClaim = lastClaim[0].version! + 1;
    }
    claim.setVersion(BigInt(versionClaim));
    const {claimsDb, revocationDb, rootsDb, issuerTree} = await getTreeState(issuerId);
    
    try {
        await issuerTree.prepareClaimForInsert(claim);
        const newClaim = new Claim({
            id: claimId,
            hi: claim.hi().toString(),
            hv: claim.hv().toString(),
            schemaHash: schemaHash,
            expiration: Number(claim.getExpirationDate()),
            updatable: claim.getFlagUpdatable(),
            version: versionClaim,
            revNonce: Number(claim.getRevocationNonce()),
            createAt: Number(Date.now()),
            status: ClaimStatus.PENDING,
            userId: userId,
            proofType: ProofType.MTP,
            issuerId: issuerId,
            schemaRegistryId: schemaRegistryId
        });
        await newClaim.save();
        await saveTreeState(issuerTree);
        await closeLevelDb(claimsDb, revocationDb, rootsDb);
        return claimId;
    } catch (err: any) {
        await closeLevelDb(claimsDb, revocationDb, rootsDb);
        throw(err);
    }
}

export async function getClaimByClaimId(claimId: string) {
    const claim = await Claim.findOne({id: claimId});
    if (!claim) {
        throw("ClaimId not exist!");
    }

    return {
        claimId: claimId,
        hi: claim.hi!,
        hv: claim.hv!,
        schemaHash: claim.schemaHash!,
        expiration: claim.expiration,
        updatable: claim.updatable,
        version: claim.version!,
        revNonce: claim.revNonce!,
        status: claim.status!,
        userId: claim.userId!,
        proofType: claim.proofType,
        issuerId: claim.issuerId!,
        schemaRegistryId: claim.schemaRegistryId

    }
}

export async function getQueryMTPInput(issuerId: string, hi: string) {
    const {claimsDb, revocationDb, rootsDb, issuerTree} = await getTreeState(issuerId);
    try {
        const kycQueryMTPInput = await zidenjsWitness.queryMTP.kycGenerateQueryMTPInput(
            GlobalVariables.F.e(hi),
            issuerTree
        );
        await closeLevelDb(claimsDb, revocationDb, rootsDb);
        return {
            kycQueryMTPInput: JSON.parse(serializaData(kycQueryMTPInput))
        }
    } catch (err: any) {
        await closeLevelDb(claimsDb, revocationDb, rootsDb);
        throw(err);
    }
}

export async function getNonRevQueryMTPInput(issuerId: string, revNonce: number) {
    const {claimsDb, revocationDb, rootsDb, issuerTree} = await getTreeState(issuerId);
    try {
        const kycNonRevQueryMTPInput = await zidenjsWitness.queryMTP.kycGenerateNonRevQueryMTPInput(
            BigInt(revNonce),
            issuerTree
        );
        await closeLevelDb(claimsDb, revocationDb, rootsDb);
        return {
            kycQueryMTPInput: JSON.parse(serializaData(kycNonRevQueryMTPInput))
        }
    } catch (err: any) {
        await closeLevelDb(claimsDb, revocationDb, rootsDb);
        throw(err);
    }
}

export async function queryClaim( issuerId: string, status: Array<string>, holderId: string, schemaHash: string) {
    let query: any = {};
    if (issuerId != "") {
        query["issuerId"] = issuerId;
    }
    if (status.length != 0) {
        query["status"] = {"$in": status};
    }
    if (holderId != "") {
        query["userId"] = holderId;
    }
    if (schemaHash != "") {
        query["schemaHash"] = schemaHash;
    }

    const claims = await Claim.find(query);
    const claimsResponse: Array<any> = [];

    for (let i = 0; i < claims.length; i++) {
        claimsResponse.push({
            claimId: claims[i].id,
            status: claims[i].status,
            holderId: claims[i].userId,
            issuerId: claims[i].issuerId,
            schemaHash: claims[i].schemaHash,
            createAt: claims[i].createAt,
            revNonce: claims[i].revNonce
        });
    }

    return claimsResponse;
}

export async function getClaimStatus(claimId: string) {
    const claims = await Claim.findOne({id: claimId});
    if (!claims) {
        throw("ClaimId not existed");
    }
    return claims.status;
}

export async function setRevokeClaim(revNonces: Array<number>) {
    const claims = await Claim.find({revNonce: {$in: revNonces}, status: ClaimStatus.ACTIVE});
    const idClaims: Array<any> = [];
    for (let i = 0; i < claims.length; i++) {
        claims[i].status = ClaimStatus.PENDING_REVOKE;
        await claims[i].save();
        idClaims.push({
            claimId: claims[i].id,
            revNonce: claims[i].revNonce
        });
    }
    return idClaims;
}