import {trees as zidenjsTrees, utils as zidenjsUtils, claim as zidenjsClaim, witness as zidenjsWitness} from "zidenjs";
import Issuer from "../models/Issuer.js";
import TreeState from "../models/TreeState.js";
import { closeLevelDb, copyDb, createNewLevelDb, openLevelDb } from "./LevelDbManager.js";
import { v4 } from "uuid";
import { PRIVATEKEY, PUBKEYX, PUBKEYY } from "../common/config/secrets.js";
import { authenSchemaHash, levelDbSrc, levelDbStateBackup, serverAuthenTreeId } from "../common/config/constant.js";
import { ClaimStatus, OperatorType, ProofType } from "../common/enum/EnumType.js";
import { checkIssuerExisted, getIssuer, getIssuerIdByPublicKey, updateIssuer } from "./Issuer.js";
import Claim from "../models/Claim.js";
import { checkTreeLock, lockTree, unlockTree } from "./TreeLock.js";
import { checkOperatorExisted, saveNewOperator } from "./Operator.js";
import { GlobalVariables } from "../common/config/global.js";

export async function saveTreeState(issuerTree: zidenjsTrees.Trees) {
    const issuerId = zidenjsUtils.bufferToHex(issuerTree.userID);
    const treeState = await TreeState.findOne({userID: issuerId});
    if (!treeState) {
        const newTree = new TreeState({
            rootsVersion: issuerTree.rootsVersion,
            revocationNonce: issuerTree.revocationNonce,
            userID: issuerId,
            lastestRootsVersion: issuerTree.rootsVersion,
            lastestRevocationNonce: issuerTree.revocationNonce,
            isLockPublish: false
        });
        await newTree.save();
    } else {
        treeState.rootsVersion = issuerTree.rootsVersion;
        treeState.revocationNonce = issuerTree.revocationNonce;
        await treeState.save();
    }
}

export async function saveLastStateTransistion(issuerId: string) {
    const treeState = await TreeState.findOne({userID: issuerId});
    if (!treeState) {
        return;
    } else {
        treeState.lastestRevocationNonce = treeState.revocationNonce;
        treeState.lastestRootsVersion = treeState.rootsVersion;
        await treeState.save();
    }
}

export async function checkLockTreeState(issuerId: string) {
    const treeState = await TreeState.findOne({userID: issuerId});
    if (!treeState) {
        throw("IssuerId not existed");
    }
    if (treeState.isLockPublish == true) {
        return true;
    } else {
        return false;
    }
}

export async function changeLockTreeState(issuerId: string, lock: boolean) {
    const treeState = await TreeState.findOne({userID: issuerId});
    if (!treeState) {
        throw("IssuerId not existed");
    }
    treeState.isLockPublish = lock;
    await treeState.save();
}

export async function getTreeState(issuerId: string) {
    const issuer = await Issuer.findOne({issuerId: issuerId});
    if (!issuer) {
        throw("IssuerId not exist!");
    }
    if (!issuer.pathDb) {
        throw("Invalid pathDb");
    }

    const issuerTreeState = await TreeState.findOne({userID: issuerId});
    if (!issuerTreeState) {
        throw("Issuer not exist");
    }

    await openLevelDb(issuer.pathDb);
    const src = issuer.pathDb;
    const claimsTree = new zidenjsTrees.smt.BinSMT(
        GlobalVariables.levelDb[src].claimsDb,
        await GlobalVariables.levelDb[src].claimsDb.getRoot(),
        32
    );

    const revocationTree = new zidenjsTrees.smt.BinSMT(
        GlobalVariables.levelDb[src].revocationDb,
        await GlobalVariables.levelDb[src].revocationDb.getRoot(),
        32
    );

    const rootsTree = new zidenjsTrees.smt.BinSMT(
        GlobalVariables.levelDb[src].rootsDb,
        await GlobalVariables.levelDb[src].rootsDb.getRoot(),
        32
    );

    const issuerTree = new zidenjsTrees.Trees(
        claimsTree,
        revocationTree,
        rootsTree,
        issuerTreeState.rootsVersion!,
        issuerTreeState.revocationNonce!,
        zidenjsUtils.hexToBuffer(issuerId, 31),
        32
    );

    return issuerTree;
}

export async function registerIssuer(pubkeyX: string, pubkeyY: string) {
    const isRegister = await checkIssuerExisted(pubkeyX, pubkeyY);
    if (isRegister) {
        throw("Issuer is registed!");
    }

    const serverIssuerId = await getIssuerIdByPublicKey(PUBKEYX, PUBKEYY);
    if ((await checkTreeLock(serverIssuerId))) {
        throw("AuthenTree is updating!");
    }

    await lockTree(serverIssuerId);
    const id = v4();
    const pathLevelDb = await createNewLevelDb(id);
    
    try {
    
        const newIssuerAuthClaim = await zidenjsClaim.authClaim.newAuthClaimFromPublicKey(BigInt(pubkeyX), BigInt(pubkeyY));
        const newIssuerTree = await zidenjsTrees.Trees.generateID(
            [newIssuerAuthClaim],
            GlobalVariables.levelDb[pathLevelDb].claimsDb,
            GlobalVariables.levelDb[pathLevelDb].revocationDb,
            GlobalVariables.levelDb[pathLevelDb].rootsDb,
            zidenjsClaim.id.IDType.Default,
            32,
            0
        );
        
        const serverAuthenTree = await getTreeState(serverIssuerId);
        
        const newIssuerAdminClaim = zidenjsClaim.entry.newClaim(
            zidenjsClaim.entry.schemaHashFromBigInt(BigInt(authenSchemaHash)),
            zidenjsClaim.entry.withValueData( zidenjsUtils.numToBits(BigInt(OperatorType.ADMIN), 32), zidenjsUtils.numToBits(BigInt(0), 32)),
            zidenjsClaim.entry.withIndexID(newIssuerTree.userID)
        );
    
        let serverPrivateKey = zidenjsUtils.hexToBuffer(PRIVATEKEY, 32);
        const serverAuthClaim = await zidenjsClaim.authClaim.newAuthClaimFromPublicKey(BigInt(PUBKEYX), BigInt(PUBKEYY));
        await zidenjsWitness.stateTransition.stateTransitionWitness(
            serverPrivateKey,
            serverAuthClaim,
            serverAuthenTree,
            [newIssuerAdminClaim],
            []
        );
    
        await updateIssuer(
            zidenjsUtils.bufferToHex(newIssuerTree.userID),
            pubkeyX,
            pubkeyY,
            pathLevelDb
        );
    
        await saveTreeState(serverAuthenTree);
        await saveTreeState(newIssuerTree);
    
        const newClaim = new Claim({
            id: v4(),
            hi: newIssuerAdminClaim.hi().toString(),
            hv: newIssuerAdminClaim.hv().toString(),
            schemaHash: authenSchemaHash,
            expiration: Number(newIssuerAdminClaim.getExpirationDate()),
            updatable: false,
            version: Number(newIssuerAdminClaim.getVersion().toString()),
            revNonce: Number(newIssuerAdminClaim.getRevocationNonce()),
            createAt: Number(Date.now()),
            status: ClaimStatus.ACTIVE,
            userId: zidenjsUtils.bufferToHex(newIssuerTree.userID),
            proofType: ProofType.MTP,
            issuerId: zidenjsUtils.bufferToHex(serverAuthenTree.userID),
            schemaRegistryId: "",
        });
    
        await newClaim.save();
        
        await unlockTree(serverIssuerId);

        const checkOperator = await checkOperatorExisted(newClaim.issuerId!, newClaim.issuerId!);
        if (!checkOperator) {
            await saveNewOperator(newClaim.issuerId!, OperatorType.ADMIN, newClaim.id!, newClaim.issuerId!);
        }

        // await closeLevelDb(serverAuthenTree.claimsDb, serverAuthenTree.revocationDb, serverAuthenTree.rootsDb);
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        return {
            issuerId: zidenjsUtils.bufferToHex(newIssuerTree.userID),
            claimId: newClaim.id,
            version: newClaim.version,
            revNonce: newClaim.revNonce
        };
    } catch (err: any) {
        await unlockTree(serverIssuerId);
        // await closeLevelDb(claimsDb, revocationDb, rootsDb);
        throw(err);
    }
}

export async function setupAuthenTree() {
    const checkIssuer = await checkIssuerExisted(PUBKEYX, PUBKEYY);
    if (checkIssuer) {
        console.log("AuthenTree setup!");
        return;
    }

    const pathLevelDb = await createNewLevelDb(serverAuthenTreeId);

    const serverAuthClaim = await zidenjsClaim.authClaim.newAuthClaimFromPublicKey(BigInt(PUBKEYX), BigInt(PUBKEYY));

    const authenTree = await zidenjsTrees.Trees.generateID(
        [serverAuthClaim],
        GlobalVariables.levelDb[pathLevelDb].claimsDb,
        GlobalVariables.levelDb[pathLevelDb].revocationDb,
        GlobalVariables.levelDb[pathLevelDb].rootsDb,
        zidenjsClaim.id.IDType.Default,
        32,
        0
    );

    const serverId = zidenjsUtils.bufferToHex(authenTree.userID);
    await updateIssuer(serverId, PUBKEYX, PUBKEYY, pathLevelDb);

    await saveTreeState(authenTree);

    // await closeLevelDb(claimsDb, revocationDb, rootsDb);
}

export async function restoreLastStateTransition(issuerId: string) {
    const issuer = await getIssuer(issuerId);
    const treeState = await TreeState.findOne({userID: issuerId});
    if (!treeState) {
        throw("IssuerId not exist!");
    }

    await restoreLastStateTransition(issuer.pathDb!);
    
    treeState.rootsVersion = treeState.lastestRootsVersion;
    await treeState.save();
}