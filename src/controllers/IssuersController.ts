import { Request, Response } from "express";
import { buildErrorMessage } from "../common/APIBuilderResponse.js";
import { ExceptionMessage } from "../common/enum/ExceptionMessages.js";
import { getAllIssuer, getIssuerInfor } from "../services/Issuer.js";

export class IssuerController {
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