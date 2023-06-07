import { Router } from "express";
import { IssuerController } from "../controllers/IssuersController.js";

export class IssuerRooutes {
    public router: Router;
    public issuerController = new IssuerController();
    constructor () {
        this.router = Router();
        this.routers();
    }

    routers(): void {
        this.router.post("/register", this.issuerController.registerIssuer);
        this.router.put("/:issuerId/restore-last-state", this.issuerController.restoreLastState);
        this.router.get("/:issuerId/profile", this.issuerController.getIssuerInfor);
        this.router.get("", this.issuerController.getAllIssuerId);
    }
}