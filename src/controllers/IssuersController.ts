import { Request, Response } from "express";
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { ExceptionMessage } from "../common/enum/ExceptionMessages.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";
import { getAllIssuer, getIssuerInfor } from "../services/Issuer.js";
import { createNewOperator, disableOperator, getListOperator, getOperatorInfor } from "../services/Operator.js";
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

    public async addNewOperator(req: Request, res: Response) {
        try {
            const {issuerId} = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw("IssuerId invalid!");
            }

            const {operatorId} = req.body;
            if (!operatorId || typeof operatorId != "string") {
                throw("OperatorId invalid!");
            }

            await createNewOperator(operatorId, issuerId);
            res.status(200).send(buildResponse(ResultMessage.APISUCCESS.apiCode, {}, ResultMessage.APISUCCESS.message));
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async deleteOperator(req: Request, res: Response) {
        try {
            const {issuerId, operatorId} = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw("IssuerId invalid!");
            }

            if (!operatorId || typeof operatorId != "string") {
                throw("OperatorId invalid!");
            }

            await disableOperator(operatorId, issuerId);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, {}, ResultMessage.APISUCCESS.message));
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getOperatorInfor(req: Request, res: Response) {
        try {
            const {issuerId, operatorId} = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw("IssuerId invalid!");
            }

            if (!operatorId || typeof operatorId != "string") {
                throw("OperatorId invalid!");
            }

            const operator = await getOperatorInfor(operatorId, issuerId);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, operator, ResultMessage.APISUCCESS.message));
        
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getListOperator(req: Request, res: Response) {
        try {
            const {issuerId} = req.params;
            if (!issuerId || typeof issuerId != "string") {
                throw("IssuerId invalid!");
            }

            const operators = await getListOperator(issuerId);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, operators, ResultMessage.APISUCCESS.message));

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