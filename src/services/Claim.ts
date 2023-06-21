import { v4 } from "uuid";
import { claim as zidenjsClaim, queryMTP, schema as zidenjsSchema } from "@zidendev/zidenjs";
import { GlobalVariables } from "../common/config/global.js";
import { ClaimStatus, ProofType } from "../common/enum/EnumType.js";
import Claim from "../models/Claim.js";
import SchemaRegistry from "../models/SchemaRegistry.js";
import { serializaData, serializaDataClaim } from "../util/utils.js";
import { getRawSchema } from "./Schema.js";
import { getTreeState, saveTreeState } from "./TreeState.js";
import libsodium from "libsodium-wrappers";
import Entry from "../models/Entry.js";

export async function createClaim(data: any, holderId: string, registryId: string) {
    const registry = await SchemaRegistry.findOne({id: registryId});
    if (!registry) {
        throw("RegistryId not exist!");
    }

    const schemaHash = registry.schemaHash;
    if (typeof schemaHash != "string") {
        throw("SchemaHash not exist!");
    }
    const schema = await getRawSchema(schemaHash);
    if (!schema) {
        throw("SchemaHash not exist!");
    }

    const claim = zidenjsSchema.buildEntryFromSchema(data, holderId, schema, registry);
    return {claim: claim, schemaHash: schemaHash};
}

export async function saveClaim(claim: zidenjsClaim.Entry, schemaHash: string, userId: string, issuerId: string, schemaRegistryId: string) {
    const claimId = v4();
    const lastClaim = await Claim.find({userId: userId, schemaHash: schemaHash}).limit(1).sort({"version": -1});
    let versionClaim = 0;
    if (lastClaim.length != 0) {
        versionClaim = lastClaim[0].version! + 1;
    }
    claim.setVersion(BigInt(versionClaim));
    const issuerTree = await getTreeState(issuerId);
    
    try {
        let claimStatus = ClaimStatus.PENDING;
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
            status: claimStatus,
            userId: userId,
            proofType: ProofType.MTP,
            issuerId: issuerId,
            schemaRegistryId: schemaRegistryId
        });
        
        await newClaim.save();
        await saveTreeState(issuerTree);
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        return claimId;
    } catch (err: any) {
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
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
    const issuerTree = await getTreeState(issuerId);
    try {
        const kycQueryMTPInput = await queryMTP.kycGenerateQueryMTPInput(
            GlobalVariables.F.e(hi),
            issuerTree
        );
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        return {
            kycQueryMTPInput: JSON.parse(serializaData(kycQueryMTPInput))
        }
    } catch (err: any) {
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        throw(err);
    }
}

export async function getNonRevQueryMTPInput(issuerId: string, revNonce: number) {
    const issuerTree = await getTreeState(issuerId);
    try {
        const kycNonRevQueryMTPInput = await queryMTP.kycGenerateNonRevQueryMTPInput(
            BigInt(revNonce),
            issuerTree
        );
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        return {
            kycQueryMTPInput: JSON.parse(serializaData(kycNonRevQueryMTPInput))
        }
    } catch (err: any) {
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        throw(err);
    }
}

export async function queryClaim( issuerId: string, status: Array<string>, holderId: string, schemaHash: string, claimId: Array<string>) {
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
    if (claimId.length != 0) {
        query["id"] = {"$in": claimId};
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

export async function setRevokeClaim(revNonces: Array<number>, issuerId: string) {
    const claims = await Claim.find({revNonce: {$in: revNonces}, status: ClaimStatus.ACTIVE, issuerId: issuerId});
    const idClaims: Array<any> = [];
    for (let i = 0; i < claims.length; i++) {
        claims[i].status = ClaimStatus.PENDING_REVOKE;
        await claims[i].save();
        idClaims.push({
            claimId: claims[i].id,
            revNonce: claims[i].revNonce,
            issuerId: claims[i].issuerId
        });
    }
    return idClaims;
}

export async function encodeClaim(claim: zidenjsClaim.Entry, rawData: any, clientPubkey: string) {
    let data = serializaData({
        rawData: rawData,
        claim: serializaDataClaim(claim)
    });
    
    await libsodium.ready;

    while(clientPubkey.length < 64) {
        clientPubkey = "0" + clientPubkey;
    }
        
    let serverKeyPair = libsodium.crypto_box_keypair("hex");

    while(serverKeyPair.privateKey.length < 64) {
        serverKeyPair.privateKey = "0" + serverKeyPair.privateKey;
    }

    while(serverKeyPair.publicKey.length < 64) {
        serverKeyPair.publicKey = "0" + serverKeyPair.publicKey;
    }

    const nonce = libsodium.randombytes_buf(libsodium.crypto_box_NONCEBYTES, "hex");
    const cipher = libsodium.crypto_box_easy(data, libsodium.from_hex(nonce), libsodium.from_hex(clientPubkey), libsodium.from_hex(serverKeyPair.privateKey), "hex");
    return {
        cipher: cipher,
        nonce: nonce,
        serverPublicKey: serverKeyPair.publicKey
    }
}

export async function saveEntryData(claimdId: string, claim: zidenjsClaim.Entry, rawData: Object) {
    const newRaw = new Entry({
        claimId: claimdId,
        rawData: serializaData(rawData).toString(),
        entry: serializaDataClaim(claim)
    });

    await newRaw.save();
}

export async function getEntryData(claimId: string) {
    try {
        const rawData = await Entry.findOne({claimId: claimId});
        if (!rawData) {
            throw("Not have entry data for claimId: " + claimId);
        }

        let claim = rawData.entry;
        let data = {};
        if (rawData.rawData) {
            data = JSON.parse(rawData.rawData);
        }

        return {
            entry: claim,
            data: data
        };

    } catch (err: any) {
        throw (err);
    }
}