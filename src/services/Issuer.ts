import { ClaimStatus } from "../common/enum/EnumType.js";
import Claim from "../models/Claim.js";
import Issuer from "../models/Issuer.js";

export async function saveIssuer(issuerId: string, authHi: string , pubkeyX: string, pubkeyY: string, pathDb: string, privateKey: string, name: string, description: string, logoUrl: string) {
    const checkIssuer = await Issuer.findOne({issuerId: issuerId});
    if (!checkIssuer) {
        const issuer = new Issuer({
            issuerId: issuerId,
            authHi: authHi,
            pubkeyX: pubkeyX,
            pubkeyY: pubkeyY,
            pathDb: pathDb,
            name: name,
            description: description,
            logoUrl: logoUrl
        });
        await issuer.save();
    } else {
        throw("Issuer is existed!");
    }
}

export async function getIssuer(issuerId: string) {
    const issuer = await Issuer.findOne({issuerId: issuerId});
    if (!issuer) {
        throw("Issuer is not existed");
    } else {
        return {
            issuerId: issuer.issuerId,
            authHi: issuer.authHi,
            pubkeyX: issuer.pubkeyX,
            pubkeyY: issuer.pubkeyY,
            pathDb: issuer.pathDb,
            privateKey: issuer.privateKey,
            name: issuer.name,
            description: issuer.description,
            logoUrl: issuer.logoUrl
        }
    }
}

export async function updateIssuer(issuerId: string, authHi: string , pubkeyX: string, pubkeyY: string, pathDb: string, privateKey: string, name: string, description: string, logoUrl: string) {
    const checkIssuer = await Issuer.findOne({issuerId: issuerId});
    if (!checkIssuer) {
        const issuer = new Issuer({
            issuerId: issuerId,
            authHi: authHi,
            pubkeyX: pubkeyX,
            pubkeyY: pubkeyY,
            pathDb: pathDb,
            privateKey: privateKey,
            name: name,
            description: description,
            logoUrl: logoUrl
        });
        await issuer.save();
    } else {
        checkIssuer.pathDb = pathDb;
        checkIssuer.authHi = authHi;
        checkIssuer.pubkeyX = pubkeyX;
        checkIssuer.pubkeyY = pubkeyY;
        checkIssuer.name = name;
        checkIssuer.description = description;
        checkIssuer.logoUrl = logoUrl;
        await checkIssuer.save();
    }
}

export async function getIssuerIdByPublicKey(pubkeyX: string, pubkeyY: string) {
    const issuer = await Issuer.findOne({pubkeyX: pubkeyX, pubkeyY: pubkeyY});
    if (!issuer) {
        throw("Issuer is not exist!");
    }
    return issuer.issuerId!;
}

export async function checkIssuerExisted(pubkeyX: string, pubkeyY: string) {
    const issuer = await Issuer.findOne({pubkeyX: pubkeyX, pubkeyY: pubkeyY});
    if (!issuer) {
        return false;
    } else {
        return true;
    }
}

export async function getIssuerInfor(issuerId: string) {
    const numPublishClaims = await Claim.countDocuments({"issuerId": issuerId, status: ClaimStatus.ACTIVE});
    const numHolders = (await Claim.aggregate([{"$match": {"issuerId": issuerId}}, {"$group": {_id: "$userId"}}])).length;
    const issuer = (await Issuer.findOne({issuerId: issuerId}));
    if (!issuer) {
        throw("Issuer not existed!");
    }
    return {
        issuerId: issuerId,
        numPublishClaims: numPublishClaims,
        numHolders: numHolders,
        name: issuer.name,
        description: issuer.description,
        logoUrl: issuer.logoUrl
    }
}

export async function getAllIssuer() {
    const issuers = await Issuer.find();
    let listIssuer: Array<any> = [];
    for (let i = 0; i < issuers.length; i++) {
        const ans = await getIssuerInfor(issuers[i].issuerId!);
        listIssuer.push(ans);
    }
    return listIssuer; 
}