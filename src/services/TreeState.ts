import {trees as zidenjsTrees, utils as zidenjsUtils, claim as zidenjsClaim, witness as zidenjsWitness} from "zidenjs";
import Issuer from "../models/Issuer.js";
import TreeState from "../models/TreeState.js";
import { createNewLevelDb, openLevelDb } from "./LevelDbManager.js";
import { v4 } from "uuid";
import { OperatorType } from "../common/enum/EnumType.js";
import { checkIssuerExisted, getIssuer, updateIssuer } from "./Issuer.js";
import { checkOperatorExisted, saveNewOperator } from "./Operator.js";
import { GlobalVariables } from "../common/config/global.js";
import { registerNewIssuer } from "./Authen.js";
import AuthenClaim from "../models/AuthenClaim.js";

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
                
        const issuerId = zidenjsUtils.bufferToHex(newIssuerTree.userID);
        
        const issuerRegisterResponse = await registerNewIssuer(issuerId);

        await updateIssuer(
            issuerId,
            pubkeyX,
            pubkeyY,
            pathLevelDb
        );
        await saveTreeState(newIssuerTree);
        
        const checkOperator = await checkOperatorExisted(issuerId!, issuerId!);
        if (!checkOperator) {
            await saveNewOperator(issuerId, OperatorType.ADMIN, issuerRegisterResponse.claimId, issuerId);
        }

        const newAuthenClaim = new AuthenClaim({
            issuerId: issuerId,
            userId: issuerId,
            claimId: issuerRegisterResponse.claimId
        });
        await newAuthenClaim.save();

        return {
            issuerId: issuerId,
            claimId: issuerRegisterResponse.claimId,
            version: issuerRegisterResponse.version,
            revNonce: issuerRegisterResponse.revNonce
        };
    } catch (err: any) {
        throw(err);
    }
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