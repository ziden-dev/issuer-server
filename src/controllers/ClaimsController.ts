import { Request, Response } from "express";
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { ExceptionMessage } from "../common/enum/ExceptionMessages.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";
import { changeLockTreeState, checkLockTreeState } from "../services/TreeState.js";
import { createClaim, encodeClaim, getClaimByClaimId, getClaimStatus, getEntryData, getNonRevQueryMTPInput, getQueryMTPInput, queryClaim, saveClaim, saveEntryData, setRevokeClaim } from "../services/Claim.js";
import { ClaimStatus, ProofTypeQuery } from "../common/enum/EnumType.js";
import { publishAndRevoke } from "../services/PublishAndRevokeClaim.js";

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
        
            if (claim.status != ClaimStatus.ACTIVE) {
                throw("Claim is not ACTIVE");
            }

            let queryResponse = {};
            const checkLock = await checkLockTreeState(claim.issuerId);
            if (checkLock) {
                throw("Await Publish!");
            }

            if (type == ProofTypeQuery.MTP) {
                queryResponse = await getQueryMTPInput(claim.issuerId, claim.hi);
            }

            if (type == ProofTypeQuery.NON_REV_MTP) {
                queryResponse = await getNonRevQueryMTPInput(claim.issuerId, claim.revNonce);
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
            const claimId = await saveClaim(claim, schemaHash, holderId, issuerId, registryId);
            const { cipher, nonce, serverPublicKey } = await encodeClaim(claim, data, publicKey);
            
            // publish claim
            await publishAndRevoke(issuerId);
            // end publish claim

            res.send({ claimId: claimId, encodeClaim: cipher, nonce: nonce, serverPublicKey: serverPublicKey });
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
                    const claimId = await saveClaim(claim, schemaHash, holderId, issuerId, registryId);
            
                    await saveEntryData(claimId, claim, data);

                    claimResponse.push(
                        {
                            index: i,
                            claimId: claimId
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

            // publish claim
            await publishAndRevoke(issuerId);
            // end publish

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

            const {revNonces} = req.body;

            if (revNonces == undefined || revNonces.length == 0) {
                throw ("Required array revNonces to revoke");
            }
            revNonces.forEach((revNonce: any) => {
                if (typeof revNonce != "number") {
                    throw("revNonces must be array number");
                }
            });
            const claims = await setRevokeClaim(revNonces, issuerId);
            res.status(200).send(buildResponse(ResultMessage.APISUCCESS.apiCode, {claims: claims}, ResultMessage.APISUCCESS.message))
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }
}