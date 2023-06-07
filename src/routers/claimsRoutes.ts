import { Router } from "express";
import { ClaimsController } from "../controllers/ClaimsController.js";

export class ClaimsRouters {
    public router: Router;
    public claimsController = new ClaimsController();
    constructor () {
        this.router = Router();
        this.routers();
    }

    routers(): void {
        this.router.get("", this.claimsController.queryClaim);
        this.router.get("/:claimId/proof", this.claimsController.generateProof);
        this.router.get("/:claimId/status", this.claimsController.getClaimStatus);
        this.router.get("/:claimId/retrieve", this.claimsController.retrieveClaim);
        this.router.post("/request/:issuerId", this.claimsController.requestNewClaim);
        this.router.post("/issue/:issuerId", this.claimsController.issueListClaims);
        this.router.post("/revoke-list/:issuerId", this.claimsController.revokeListClaims);
        this.router.get("/publish-challenge/:issuerId", this.claimsController.getPublishChallenge);
        this.router.get("/revoke-challenge/:issuerId", this.claimsController.getRevokeChallenge);
        this.router.get("/combined-challenge/:issuerId", this.claimsController.getCombineChallenge);
        this.router.post("/publish/:issuerId", this.claimsController.publishClaims);
        this.router.post("/revoke/:issuerId", this.claimsController.revokeClaims);
        this.router.post("/combined/:issuerId", this.claimsController.publishAndRevokeClaims);
    }
}