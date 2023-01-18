import Issuer from "../models/Issuer.js";

export async function saveIssuer(issuerId: string, pubkeyX: string, pubkeyY: string, pathDb: string) {
    const checkIssuer = await Issuer.findOne({issuerId: issuerId});
    if (!checkIssuer) {
        const issuer = new Issuer({
            issuerId: issuerId,
            pubkeyX: pubkeyX,
            pubkeyY: pubkeyY,
            pathDb: pathDb
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
            pubkeyX: issuer.pubkeyX,
            pubkeyY: issuer.pubkeyY,
            pathDb: issuer.pathDb
        }
    }
}

export async function updateIssuer(issuerId: string, pubkeyX: string, pubkeyY: string, pathDb: string) {
    const checkIssuer = await Issuer.findOne({issuerId: issuerId});
    if (!checkIssuer) {
        const issuer = new Issuer({
            issuerId: issuerId,
            pubkeyX: pubkeyX,
            pubkeyY: pubkeyY,
            pathDb: pathDb
        });
        await issuer.save();
    } else {
        checkIssuer.pathDb = pathDb;
        checkIssuer.pubkeyX = pubkeyX;
        checkIssuer.pubkeyY = pubkeyY;
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