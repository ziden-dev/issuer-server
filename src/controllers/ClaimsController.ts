import { Request, Response } from "express";
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { ExceptionMessage } from "../common/enum/ExceptionMessages.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";

export class ClaimsController {
    public async queryClaim(req: Request, res: Response) {
        try {

        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async generateProof(req: Request, res: Response) {
        try {

        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getClaimStatus(req: Request, res: Response) {
        try {

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

    public async getPublishChallange(req: Request, res: Response) {
        try {

        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getRevokeChallange(req: Request, res: Response) {
        try {

        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async getCombinedChallange(req: Request, res: Response) {
        try {

        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async publishClaims(req: Request, res: Response) {
        try {

        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async revokeClaims(req: Request, res: Response) {
        try {

        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async publishAndRevokeClaims(req: Request, res: Response) {
        try {

        } catch (err: any) {
            console.log(err);
            res.send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }
}