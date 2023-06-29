import { Request, Response } from "express";
import { buildErrorMessage, buildResponse } from "../common/APIBuilderResponse.js";
import { ExceptionMessage } from "../common/enum/ExceptionMessages.js";
import { ResultMessage } from "../common/enum/ResultMessages.js";
import { changeStatusRegistry, createNewRegistry, findOneRegistry, findSchemaRegistry, updateRegistry } from "../services/RegistryService.js";

export class RegistriesController {
    public async registerNewSchemaRegistry(req: Request, res: Response) {
        try {
            const {schemaHash, issuerId, description, expiration, updatable, networkId, endpointUrl} = req.body;
            const registry = await createNewRegistry(schemaHash, issuerId, description, expiration, updatable, networkId, endpointUrl);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, registry, ResultMessage.APISUCCESS.message));
        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async findSchemaRegistry(req: Request, res: Response) {
        try {
            let {schemaHash, issuerId, networkId} = req.query;
            if (!schemaHash) {
                schemaHash = "";
            }
            if (!issuerId) {
                issuerId = "";
            }

            if (typeof schemaHash != "string") {
                throw("Invalid schemaHash");
            }

            if (typeof issuerId != "string") {
                throw("Invalid issuerId");
            }

            const registries = await findSchemaRegistry(schemaHash, issuerId);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, registries, ResultMessage.APISUCCESS.message));

        } catch (err: any) {
            console.log(err);
            res.status(400).send(buildErrorMessage(ExceptionMessage.UNKNOWN.apiCode, err, ExceptionMessage.UNKNOWN.message));
        }
    }

    public async findOne(req: Request, res: Response) {
        try {
            let {registryId} = req.params;
            if (!registryId) {
                throw("required registry Id");
            }
            const registries = await findOneRegistry(registryId);
            res.send(buildResponse(ResultMessage.APISUCCESS.apiCode, registries, ResultMessage.APISUCCESS.message));

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