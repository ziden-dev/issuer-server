import { Request, Response } from "express";
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { ExceptionMessage } from "../common/enum/ExceptionMessages.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";

export class NetworkController {
    public async createNewNetwork(req: Request, res: Response) {
        try {

        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getAllNetworks(req: Request, res: Response) {
        try {

        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getNetworkById(req: Request, res: Response) {
        try {

        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async updateNetworkConfig(req: Request, res: Response) {
        try {

        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async removeNetwork(req: Request, res: Response) {
        try {

        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }
}