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
        this.router.get("/:issuerId/profile", this.issuerController.getIssuerInfor);
        this.router.get("", this.issuerController.getAllIssuerId);
    }
}