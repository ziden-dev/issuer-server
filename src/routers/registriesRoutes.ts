import { Router } from "express";
import { RegistriesController } from "../controllers/RegistriesController.js";

export class RegistriesRoutes {
    public router: Router;
    public registriesController = new RegistriesController();
    constructor () {
        this.router = Router();
        this.routers();
    }

    routers(): void {
        this.router.post("", this.registriesController.registerNewSchemaRegistry);
        this.router.get("", this.registriesController.findSchemaRegistry);
        this.router.put("/:registryId/activate", this.registriesController.changeStatusSchemaRegistry);
        this.router.get("/:registryId", this.registriesController.findOne);
    }
}