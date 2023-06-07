import { Request, Response } from "express";
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { ExceptionMessage } from "../common/enum/ExceptionMessages.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";
import { getAllIssuer, getIssuerInfor } from "../services/Issuer.js";
import { registerIssuer, restoreLastStateTransition } from "../services/TreeState.js";

export class IssuerController {
    public async registerIssuer(req: Request, res: Response) {
        try {
            const {pubkeyX, pubkeyY} = req.body;
            if (!pubkeyX || !pubkeyY || typeof pubkeyX != "string" || typeof pubkeyY != "string") {
                throw("Invalid publicKey");
            }

            const registerResponse = await registerIssuer(pubkeyX, pubkeyY);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, registerResponse, ResultMessage.APISUCCESS.message));
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async restoreLastState(req: Request, res: Response) {
        try {
            const {issuerId} = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw("IssuerId invalid!");
            }

            await restoreLastStateTransition(issuerId);
            res.status(200).send(buildResponse(ResultMessage.APISUCCESS.apiCode, {}, ResultMessage.APISUCCESS.message));

        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getIssuerInfor(req: Request, res: Response) {
        try {
            const {issuerId} = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw("IssuerId invalid!");
            }

            const ans = await getIssuerInfor(issuerId);
            res.status(200).send(ans);
            
        } catch(err: any) {
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getAllIssuerId(req: Request, res: Response) {
        try {
            const ans = await getAllIssuer();
            res.status(200).send(ans);
            return;
        } catch (err: any) {
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }
}