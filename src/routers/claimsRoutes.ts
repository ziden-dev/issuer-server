import { Router } from "express";
import { AuthenController } from "../controllers/AuthenController.js";
import { ClaimsController } from "../controllers/ClaimsController.js";

export class ClaimsRouters {
    public router: Router;
    public authenController = new AuthenController();
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
        this.router.post("/issue/:issuerId", this.authenController.authorization, this.claimsController.issueListClaims);
        this.router.post("/revoke-list/:issuerId", this.authenController.authorization, this.claimsController.revokeListClaims);
        this.router.get("/publish-challenge/:issuerId", this.authenController.authorization, this.claimsController.getPublishChallange);
        this.router.get("/revoke-challenge/:issuerId", this.authenController.authorization, this.claimsController.getRevokeChallange);
        this.router.get("/combined-challenge/:issuerId", this.authenController.authorization, this.claimsController.getCombinedChallange);
        this.router.get("/publish-challenge/:issuerId", this.authenController.authorization, this.claimsController.publishClaims);
        this.router.post("/publish/:issuerId", this.authenController.authorizationAdmin, this.claimsController.publishClaims);
        this.router.post("/revoke/:issuerId", this.authenController.authorizationAdmin, this.claimsController.revokeClaims);
        this.router.post("/combined/:issuerId", this.authenController.authorizationAdmin, this.claimsController.publishAndRevokeClaims);
    }
}