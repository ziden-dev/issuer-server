import { v4 } from "uuid";
import { claim as zidenjsClaim, witness as zidenjsWitness, schema as zidenjsSchema } from "zidenjs";
import { GlobalVariables } from "../common/config/global.js";
import { ClaimStatus, ProofType } from "../common/enum/EnumType.js";
import Claim from "../models/Claim.js";
import SchemaRegistry from "../models/SchemaRegistry.js";
import { serializaData, serializaDataClaim } from "../util/utils.js";
import { closeLevelDb } from "./LevelDbManager.js";
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

export async function saveClaim(claim: Array<zidenjsClaim.entry.Entry>, schemaHash: string, userId: string, issuerId: string, schemaRegistryId: string) {
    const claimId = v4();
    const lastClaim = await Claim.find({userId: userId, schemaHash: schemaHash}).limit(1).sort({"version": -1});
    let versionClaim = 0;
    if (lastClaim.length != 0) {
        versionClaim = lastClaim[0].version! + 1;
    }
    for (let i = 0; i < claim.length; i++) {
        claim[i].setVersion(BigInt(versionClaim));
        const issuerTree = await getTreeState(issuerId);
    
        await issuerTree.prepareClaimForInsert(claim[i]);
        const newClaim = new Claim({
            id: claimId,
            hi: claim[i].hi().toString(),
            hv: claim[i].hv().toString(),
            schemaHash: schemaHash,
            expiration: Number(claim[i].getExpirationDate()),
            updatable: claim[i].getFlagUpdatable(),
            version: versionClaim,
            revNonce: Number(claim[i].getRevocationNonce()),
            createAt: Number(Date.now()),
            status: ClaimStatus.PENDING,
            userId: userId,
            proofType: ProofType.MTP,
            issuerId: issuerId,
            schemaRegistryId: schemaRegistryId,
            claimIndex: i
        });
        await newClaim.save();
        await saveTreeState(issuerTree);
    }
    return {claim, claimId};
}

export async function getClaimByClaimId(claimId: string) {
    const claim = await Claim.find({id: claimId});
    if (claim.length == 0) {
        throw("ClaimId not exist!");
    }

    const claimsResponse = [];
    for (let i = 0; i < claim.length; i++) {
        claimsResponse.push({
            claimId: claimId,
            hi: claim[i].hi!,
            hv: claim[i].hv!,
            schemaHash: claim[i].schemaHash!,
            expiration: claim[i].expiration,
            updatable: claim[i].updatable,
            version: claim[i].version!,
            revNonce: claim[i].revNonce!,
            status: claim[i].status!,
            userId: claim[i].userId!,
            proofType: claim[i].proofType,
            issuerId: claim[i].issuerId!,
            schemaRegistryId: claim[i].schemaRegistryId,
            claimIndex: claim[i].claimIndex ?? 0
        })
    }

    return claimsResponse;
}

export async function getQueryMTPInput(issuerId: string, hi: Array< {claimIndex: number, hi: string} >) {
    const issuerTree = await getTreeState(issuerId);
    try {
        let kycQueryMTPInput = [];
        for (let i = 0; i < hi.length; i++) {
            const input = await zidenjsWitness.queryMTP.kycGenerateQueryMTPInput(
                GlobalVariables.F.e(hi[i].hi),
                issuerTree
            );
            kycQueryMTPInput.push({
                claimIndex: hi[i].claimIndex,
                kycQueryMTPInput: JSON.parse(serializaData(input))
            })
        }
        
        return kycQueryMTPInput;
    } catch (err: any) {
        throw(err);
    }
}

export async function getNonRevQueryMTPInput(issuerId: string, revNonce: Array<{claimIndex: number, revNonce: number}>) {
    const issuerTree = await getTreeState(issuerId);
    try {
        let kycNonRevQueryMTPInput = [];
        for (let i = 0; i <revNonce.length; i++) {
            const input = await zidenjsWitness.queryMTP.kycGenerateNonRevQueryMTPInput(
                BigInt(revNonce[i].revNonce),
                issuerTree
            );
            kycNonRevQueryMTPInput.push({
                claimIndex: revNonce[i].claimIndex,
                kycNonRevQueryMTPInput: JSON.parse(serializaData(input))
            })
        }
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        
        return kycNonRevQueryMTPInput;
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
            revNonce: claims[i].revNonce,
            claimIndex: claims[i].claimIndex ?? 0
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

export async function encodeClaim(claim: Array<zidenjsClaim.entry.Entry>, rawData: any, clientPubkey: string) {
    let claimSerializa = [];
    for (let i = 0; i < claim.length; i++) {
        claimSerializa.push(serializaDataClaim(claim[i]));
    }
    
    let data = serializaData({
        rawData: rawData,
        claim: claimSerializa
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

export async function saveEntryData(claimdId: string, claim: Array<zidenjsClaim.entry.Entry>, rawData: Object) {
    const entry = [];
    for (let i = 0; i < claim.length; i++) {
        entry.push(serializaDataClaim(claim[i]));
    }
    const newRaw = new Entry({
        claimId: claimdId,
        rawData: serializaData(rawData).toString(),
        entry: entry
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