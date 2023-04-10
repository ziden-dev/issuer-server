import { Request, Response } from "express";
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { ExceptionMessage } from "../common/enum/ExceptionMessages.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";
import { getChallengePublishAllClaims, getChallengeRevokeAllPendingRevoke, getCombinesChallenge as getCombineChallenge } from "../services/Challenge.js";
import { changeLockTreeState, checkLockTreeState } from "../services/TreeState.js";
import { serializaData } from "../util/utils.js";
import { claim as zidenjsClaim } from "zidenjs";
import { publishAndRevoke, publishOnly, revokeOnly } from "../services/PublishAndRevokeClaim.js";
import { createClaim, encodeClaim, getClaimByClaimId, getClaimStatus, getEntryData, getNonRevQueryMTPInput, getQueryMTPInput, queryClaim, saveClaim, saveEntryData, setRevokeClaim } from "../services/Claim.js";
import { ClaimStatus, ProofTypeQuery } from "../common/enum/EnumType.js";
import Schema from "../models/Schema.js";
import { createNewSchema } from "../services/Schema.js";
import { checkAuthenClaimExist, getAuthenProof } from "../services/Authen.js";
import Claim from "../models/Claim.js";

export class ClaimsController {
    public async queryClaim(req: Request, res: Response) {
        try {
            let {issuerId, status, holderId, schemaHash, claimId} = req.query;
            if (!issuerId) {
                issuerId = "";
            }
            if (!status) {
                status = [];
            }
            if (typeof status == "string") {
                status = [status];
            }
            if (!holderId) {
                holderId = "";
            }
            if (!schemaHash) {
                schemaHash = "";
            }
            if (!claimId) {
                claimId = [];
            }
            if (typeof claimId == "string") {
                claimId = [claimId];
            }

            if (typeof issuerId != "string" || typeof holderId != "string" || typeof schemaHash != "string") {
                throw("Invalid query input");
            }

            const claims = await queryClaim(issuerId, status as string[], holderId, schemaHash, claimId as string[]);
            res.send(
                buildResponse(ResultMessage.APISUCCESS.apiCode, claims, ResultMessage.APISUCCESS.message)
            );
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async generateProof(req: Request, res: Response) {
        try {
            const id = req.params["claimId"];
            const type = req.query["type"];
            if (!id) {
                throw("Invalid claimId!");
            }

            if (type != ProofTypeQuery.MTP && type != ProofTypeQuery.NON_REV_MTP) {
                throw("Invalid type");
            }

            const claim = await getClaimByClaimId(id);
        
            if (claim[0].status != ClaimStatus.ACTIVE) {
                throw("Claim is not ACTIVE");
            }

            let queryResponse = {};
            const checkLock = await checkLockTreeState(claim[0].issuerId);
            if (checkLock) {
                throw("Await Publish!");
            }

            if (type == ProofTypeQuery.MTP) {
                let hiList: { claimIndex: number; hi: string; }[] = [];
                claim.forEach((e) => {
                    hiList.push({
                        claimIndex: e.claimIndex,
                        hi: e.hi
                    });
                });
                queryResponse = await getQueryMTPInput(claim[0].issuerId, hiList);
            }

            if (type == ProofTypeQuery.NON_REV_MTP) {
                let revNonceList: { claimIndex: number; revNonce: number; }[] = [];
                claim.forEach((e) => {
                    revNonceList.push({
                        claimIndex: e.claimIndex,
                        revNonce: e.revNonce
                    });
                })
                queryResponse = await getNonRevQueryMTPInput(claim[0].issuerId, revNonceList);
            }

            res.status(200).send(
                buildResponse(ResultMessage.APISUCCESS.apiCode, queryResponse, ResultMessage.APISUCCESS.message)
            );
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getClaimStatus(req: Request, res: Response) {
        try {
            const {claimId} = req.params;
            if (!claimId || typeof claimId != "string") {
                throw("Invalid claimId");
            }
            const claimStatus = await getClaimStatus(claimId);
            res.send(
                buildResponse(ResultMessage.APISUCCESS.apiCode, {status: claimStatus}, ResultMessage.APISUCCESS.message)
            );
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async retrieveClaim(req: Request, res: Response) {
        try {
            const {claimId} = req.params;
            if (!claimId || typeof claimId != "string") {
                throw("Invalid claimId");
            }

            const data = await getEntryData(claimId);
            res.status(200).send(data);

        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async requestNewClaim(req: Request, res: Response) {
        try {
            const {holderId, registryId, publicKey, data} = req.body;
            const {issuerId} = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw("Invalid issuerId");
            }
            const checkLock = await checkLockTreeState(issuerId);
            if (checkLock) {
                throw("Await Publish!");
            }
            
            if (!holderId || !registryId || !publicKey || !data
                || typeof holderId != "string" || typeof registryId != "string" || typeof publicKey != "string") {
                    throw("Invalid data");
                }
            
            const {claim, schemaHash} = await createClaim(data, holderId, registryId);
            const newClaim = await saveClaim(claim, schemaHash, holderId, issuerId, registryId);
            const { cipher, nonce, serverPublicKey } = await encodeClaim(newClaim.claim, data, publicKey);
            
            res.send({ claimId: newClaim.claimId, encodeClaim: cipher, nonce: nonce, serverPublicKey: serverPublicKey });
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async issueListClaims(req: Request, res: Response) {
        try {
            let claimResponse: Array<any> = [];
            const {issuerId} = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw("Invalid issuerId");
            }
            const checkLock = await checkLockTreeState(issuerId);
            if (checkLock) {
                throw("Await Publish!");
            }

            for (let i = 0; i < req.body.length; i++) {
                try {
                    const { holderId, registryId, data } = req.body[i];
                    if (!holderId || !registryId || !data
                        || typeof holderId != "string" || typeof registryId != "string") {
                            throw("Invalid data");
                    }
        
                    const {claim, schemaHash} = await createClaim(data, holderId, registryId);
                    const newClaim = await saveClaim(claim, schemaHash, holderId, issuerId, registryId);
                    console.log(newClaim);
                    await saveEntryData(newClaim.claimId, newClaim.claim, data);

                    claimResponse.push(
                        {
                            index: i,
                            claimId: newClaim.claimId
                        }
                    );
        
                } catch (err: any) {
                    const error = (buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
                    claimResponse.push(
                        {
                            index: i,
                            err: error
                        }
                    );
                }
            }
            res.status(200).send(claimResponse);
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async revokeListClaims(req: Request, res: Response) {
        try {
            const {issuerId} = req.params;
            if (issuerId == undefined || typeof issuerId != "string") {
                throw("Invalid issuerId");
            }

            const {claimIds} = req.body;

            if (claimIds == undefined || claimIds.length == 0) {
                throw ("Required array claimIds to revoke");
            }
            claimIds.forEach((claimId: any) => {
                if (typeof claimId != "string") {
                    throw("revNonces must be array number");
                }
            });
            const claims = await setRevokeClaim(claimIds, issuerId);
            res.status(200).send(buildResponse(ResultMessage.APISUCCESS.apiCode, {claims: claims}, ResultMessage.APISUCCESS.message))
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getPublishChallenge(req: Request, res: Response) {
        try {
            const {issuerId} = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw("Invalid issuerId");
            }
            const checkLock = await checkLockTreeState(issuerId);
            if (checkLock) {
                throw("Await Publish!");
            }
            await changeLockTreeState(issuerId, true);
            try {
                const challenge = await getChallengePublishAllClaims(issuerId);
                res.send(
                    buildResponse(ResultMessage.APISUCCESS.apiCode, JSON.parse(serializaData({ challenge: challenge })), ResultMessage.APISUCCESS.message)
                );
                await changeLockTreeState(issuerId, false);
                return;
            } catch (err: any) {
                await changeLockTreeState(issuerId, false);
                throw(err);
            }
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getRevokeChallenge(req: Request, res: Response) {
        try {
            const {issuerId} = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw("Invalid issuerId");
            }
            const checkLock = await checkLockTreeState(issuerId);
            if (checkLock) {
                throw("Await Publish!");
            }
            await changeLockTreeState(issuerId, true);
            try {
                const challenge = await getChallengeRevokeAllPendingRevoke(issuerId);
                res.send(
                    buildResponse(ResultMessage.APISUCCESS.apiCode, JSON.parse(serializaData({ challenge: challenge })), ResultMessage.APISUCCESS.message)
                );
                await changeLockTreeState(issuerId, false);
                return;
            } catch (err: any) {
                await changeLockTreeState(issuerId, false);
                throw(err);
            }
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getCombineChallenge(req: Request, res: Response) {
        try {
            const {issuerId} = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw("Invalid issuerId");
            }
            const checkLock = await checkLockTreeState(issuerId);
            if (checkLock) {
                throw("Await Publish!");
            }
            await changeLockTreeState(issuerId, true);
            try {
                const challenge = await getCombineChallenge(issuerId);
                res.send(
                    buildResponse(ResultMessage.APISUCCESS.apiCode, JSON.parse(serializaData({ challenge: challenge })), ResultMessage.APISUCCESS.message)
                );
                await changeLockTreeState(issuerId, false);
                return;
            } catch (err: any) {
                await changeLockTreeState(issuerId, false);
                throw(err);
            }
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async publishClaims(req: Request, res: Response) {
        try {
            const {issuerId} = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw("Invalid issuerId");
            }
            const {signature} = req.body;
            if (!signature
                || !signature["challenge"] || !signature["challengeSignatureR8x"] || !signature["challengeSignatureR8y"] || !signature["challengeSignatureS"]) {
                throw("Invalid signature");
            }
            const signChallenge: zidenjsClaim.authClaim.SignedChallenge = {
                challenge: BigInt(signature["challenge"]),
                challengeSignatureR8x: BigInt(signature["challengeSignatureR8x"]),
                challengeSignatureR8y: BigInt(signature["challengeSignatureR8y"]),
                challengeSignatureS: BigInt(signature["challengeSignatureS"])
            }

            const checkLock = await checkLockTreeState(issuerId);
            if (checkLock) {
                throw("Await Publish!");
            }
            await changeLockTreeState(issuerId, true);
            try {
                await publishOnly(signChallenge, issuerId);
                res.send(
                    buildResponse(ResultMessage.APISUCCESS.apiCode, {}, ResultMessage.APISUCCESS.message)
                );
                await changeLockTreeState(issuerId, false);
                return;
            } catch (err: any) {
                await changeLockTreeState(issuerId, false);
                throw(err);
            }        
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async revokeClaims(req: Request, res: Response) {
        try {
            const {issuerId} = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw("Invalid issuerId");
            }
            const {signature} = req.body;
            if (!signature
                || !signature["challenge"] || !signature["challengeSignatureR8x"] || !signature["challengeSignatureR8y"] || !signature["challengeSignatureS"]) {
                throw("Invalid signature");
            }
            const signChallenge: zidenjsClaim.authClaim.SignedChallenge = {
                challenge: BigInt(signature["challenge"]),
                challengeSignatureR8x: BigInt(signature["challengeSignatureR8x"]),
                challengeSignatureR8y: BigInt(signature["challengeSignatureR8y"]),
                challengeSignatureS: BigInt(signature["challengeSignatureS"])
            }

            const checkLock = await checkLockTreeState(issuerId);
            if (checkLock) {
                throw("Await Publish!");
            }
            await changeLockTreeState(issuerId, true);
            try {
                await revokeOnly(signChallenge, issuerId);
                res.send(
                    buildResponse(ResultMessage.APISUCCESS.apiCode, {}, ResultMessage.APISUCCESS.message)
                );
                await changeLockTreeState(issuerId, false);
                return;
            } catch (err: any) {
                await changeLockTreeState(issuerId, false);
                throw(err);
            }        
        
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async publishAndRevokeClaims(req: Request, res: Response) {
        try {
            const {issuerId} = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw("Invalid issuerId");
            }
            const {signature} = req.body;
            if (!signature
                || !signature["challenge"] || !signature["challengeSignatureR8x"] || !signature["challengeSignatureR8y"] || !signature["challengeSignatureS"]) {
                throw("Invalid signature");
            }
            const signChallenge: zidenjsClaim.authClaim.SignedChallenge = {
                challenge: BigInt(signature["challenge"]),
                challengeSignatureR8x: BigInt(signature["challengeSignatureR8x"]),
                challengeSignatureR8y: BigInt(signature["challengeSignatureR8y"]),
                challengeSignatureS: BigInt(signature["challengeSignatureS"])
            }

            const checkLock = await checkLockTreeState(issuerId);
            if (checkLock) {
                throw("Await Publish!");
            }
            await changeLockTreeState(issuerId, true);
            try {
                await publishAndRevoke(signChallenge, issuerId);
                res.send(
                    buildResponse(ResultMessage.APISUCCESS.apiCode, {}, ResultMessage.APISUCCESS.message)
                );
                await changeLockTreeState(issuerId, false);
                return;
            } catch (err: any) {
                await changeLockTreeState(issuerId, false);
                throw(err);
            }        
        
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }
}