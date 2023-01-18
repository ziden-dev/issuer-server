import { Router } from "express";
import { AuthenController } from "../controllers/AuthenController.js";
import { SchemasController } from "../controllers/SchemasController.js";

export class SchemasRouter {
    public router: Router;
    public authenController = new AuthenController();
    public schemaController = new SchemasController();
    constructor () {
        this.router = Router();
        this.routers();
    }

    routers(): void {
        this.router.post("", this.schemaController.createNewSchema);
        this.router.get("", this.schemaController.getAllSchemas);
        this.router.post("/:schemaHash", this.schemaController.getSchemaBySchemaHash);
    }
}