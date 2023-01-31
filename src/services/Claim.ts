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