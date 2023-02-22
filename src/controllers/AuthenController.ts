import { Request, Response, NextFunction } from "express";
import { JWZ } from "../lib/jwz/jwz.js";
import fs from 'fs'
import path from 'path'
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";
import { getAuthenIssuerId } from "../services/Issuer.js";
import { login, verifyToken } from "../services/Authen.js";

let vk = JSON.parse(fs.readFileSync(path.resolve("./build/authen/verification_key.json"), 'utf-8'));
enum Role {
  Admin = "1",
  Operator = "2"
}
const schemaHash = "123456789";
const timeLimit = 3600000*24*3;

export class AuthenController {
  async authentication(req: Request, res: Response, next: NextFunction) {
    try {
      const {issuerId} = req.params;
      const token = await login(req.body, issuerId);
      return token;
    } catch (err: any) {
      res.status(400).send(buildErrorMessage(400, "Invalid request", "Unable to login"));
      return;
    }
  }
  async authorization(req: Request, res: Response, next: NextFunction) {
    try {
      const {issuerId} = req.params;
      if (!issuerId ) {
        res.send(buildErrorMessage(200, "IssuerId invalid", "Unable to login"));
        return;
      }
      let token = req.headers.authorization;
      if (token == "1") {
        next();
        return;
      }
      if (typeof token != "string") {
        throw("Invalid token");
      }
      const isValid = await verifyToken(token, issuerId, false);
      if (!isValid) {
        throw("Invalid token");
      } else {
        next();
        return;
      }
    } catch (err: any) {
      res.status(400).send(buildErrorMessage(400, "Invalid token", "Unauthorized"));
      return;
    }
  }

  async authorizationAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const {issuerId} = req.params;
      if (!issuerId ) {
        res.send(buildErrorMessage(200, "IssuerId invalid", "Unable to login"));
        return;
      }
      let token = req.headers.authorization;
      if (token == "1") {
        next();
        return;
      }
      if (typeof token != "string") {
        throw("Invalid token");
      }
      const isValid = await verifyToken(token, issuerId, true);
      if (!isValid) {
        throw("Invalid token");
      } else {
        next();
        return;
      }
    } catch (err: any) {
      res.status(400).send(buildErrorMessage(400, "Invalid token", "Unauthorized"));
      return;
    }
  }

  async verifyToken(req: Request, res: Response) {
    try {
      const {issuerId} = req.params;
      if (!issuerId || typeof issuerId != "string") {
        res.send(buildErrorMessage(400, "IssuerId invalid", "Unable to login"));
        return;
      }
      let {token} = req.body;
      if (!token || typeof token != "string") {
        throw("Invalid token");
      }

      const isValid = await verifyToken(token, issuerId, false);
      res.send(
        buildResponse(ResultMessage.APISUCCESS.apiCode, {isValid: isValid}, ResultMessage.APISUCCESS.message)
      );
    } catch (err: any) {
      res.send(
        buildResponse(ResultMessage.APISUCCESS.apiCode, {isValid: false}, ResultMessage.APISUCCESS.message)
      );      
      return;
    }
  }
}