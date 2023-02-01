import { Request, Response } from "express";
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { ExceptionMessage } from "../common/enum/ExceptionMessages.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";
import { getChallengePublishAllClaims, getChallengeRevokeAllPendingRevoke, getCombinesChallenge as getCombineChallenge } from "../services/Challenge.js";
import { changeLockTreeState, checkLockTreeState } from "../services/TreeState.js";
import { serializaData } from "../util/utils.js";
import { claim as zidenjsClaim } from "zidenjs";
import { publishAndRevoke, publishOnly, revokeOnly } from "../services/PublishAndRevokeClaim.js";
import { getClaimByClaimId, getClaimStatus, getNonRevQueryMTPInput, getQueryMTPInput, queryClaim } from "../services/Claim.js";
import { ClaimStatus, ProofTypeQuery } from "../common/enum/EnumType.js";
import Schema from "../models/Schema.js";
import { createNewSchema } from "../services/Schema.js";

export class ClaimsController {
    public async queryClaim(req: Request, res: Response) {
        try {
            let {issuerId, status, holderId, schemaHash} = req.query;
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

            if (typeof issuerId != "string" || typeof holderId != "string" || typeof schemaHash != "string") {
                throw("Invalid query input");
            }

            const claims = await queryClaim(issuerId, status as string[], holderId, schemaHash);
            res.send(
                buildResponse(ResultMessage.APISUCCESS.apiCode, claims, ResultMessage.APISUCCESS.message)
            );
        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async generateProof(req: Request, res: Response) {
        try {
            const id = req.params["claimId"];
            const type = req.query["type"];
            if (!id) {
                throw("Invalid claimId!");
            }

            const claim = await getClaimByClaimId(id);
            if (claim.status != ClaimStatus.ACTIVE) {
                throw("Claim is not ACTIVE");
            }

            let queryResponse = {};

            if (type == ProofTypeQuery.MTP) {
                queryResponse = await getQueryMTPInput(claim.issuerId, claim.hi);
            }

            if (type == ProofTypeQuery.NON_REV_MTP) {
                queryResponse = await getNonRevQueryMTPInput(claim.issuerId, claim.revNonce);
            }

            res.send(
                buildResponse(ResultMessage.APISUCCESS.apiCode, queryResponse, ResultMessage.APISUCCESS.message)
            );
        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
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
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async retrieveClaim(req: Request, res: Response) {
        try {

        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async requestNewClaim(req: Request, res: Response) {
        try {

        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async issueListClaims(req: Request, res: Response) {
        try {

        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async revokeListClaims(req: Request, res: Response) {
        try {

        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
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
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
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
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
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
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
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
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
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
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
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
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }
}