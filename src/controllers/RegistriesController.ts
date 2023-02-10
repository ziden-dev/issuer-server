import { Request, Response } from "express";
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { ExceptionMessage } from "../common/enum/ExceptionMessages.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";
import { changeStatusRegistry, createNewRegistry, findSchemaRegistry, updateRegistry } from "../services/RegistryService.js";

export class RegistriesController {
    public async registerNewSchemaRegistry(req: Request, res: Response) {
        try {
            const {schemaHash, issuerId, description, expiration, updatable, network, endpointUrl} = req.body;
            const registry = await createNewRegistry(schemaHash, issuerId, description, expiration, updatable, network, endpointUrl);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, registry, ResultMessage.APISUCCESS.message));
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async findSchemaRegistry(req: Request, res: Response) {
        try {
            let {schemaHash, issuerId, network} = req.query;
            if (!schemaHash) {
                schemaHash = "";
            }
            if (!issuerId) {
                issuerId = "";
            }
            if (!network) {
                network = "";
            }

            if (typeof schemaHash != "string") {
                throw("Invalid schemaHash");
            }

            if (typeof issuerId != "string") {
                throw("Invalid issuerId");
            }

            if (typeof network != "string") {
                throw("Invalid network");
            }

            const registries = await findSchemaRegistry(schemaHash, issuerId, network);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, registries, ResultMessage.APISUCCESS.message));

        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async updateRegistrySchema(req: Request, res: Response) {
        try {
            const {registryId} = req.params;
            if (!registryId || typeof registryId != "string") {
                throw("Invalid registryId");
            }
            const {schemaHash, issuerId, description, expiration, updatable, network, endpointUrl} = req.body;
            if (schemaHash == undefined || issuerId == undefined 
                || description == undefined || expiration == undefined 
                || updatable == undefined || !endpointUrl == undefined) {
                throw("Invalid input");
            }

            const registry = await updateRegistry(registryId, schemaHash, issuerId, description, expiration, updatable, network, endpointUrl);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, registry, ResultMessage.APISUCCESS.message));
        
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async changeStatusSchemaRegistry(req: Request, res: Response) {
        try {
            const {registryId} = req.params;
            if (!registryId || typeof registryId != "string") {
                throw("Invalid registryId");
            }

            const {isActive} = req.body;
            if (typeof isActive != "boolean") {
                throw("Invalid isActive")
            }

            const registry = await changeStatusRegistry(registryId, isActive);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, registry, ResultMessage.APISUCCESS.message));

        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }
                
}