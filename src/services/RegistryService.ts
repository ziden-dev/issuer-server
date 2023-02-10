import { v4 } from "uuid";
import Issuer from "../models/Issuer.js";
import Schema from "../models/Schema.js";
import SchemaRegistry from "../models/SchemaRegistry.js";

export async function createNewRegistry(schemaHash: string, issuerId: string, description: string, expiration: number, updateble: boolean, network: string, endpointUrl: string) {    
    if (!schemaHash) {
        schemaHash = "";
    }

    if (!issuerId) {
        issuerId = "";
    }

    if (!description) {
        description = "";
    }

    if (!updateble) {
        updateble = false;
    }

    if (!network) {
        network = "";
    }

    if (!endpointUrl) {
        endpointUrl = "";
    }

    if (!expiration) {
        expiration = 0;
    }

    const schema = await Schema.findOne({"@hash": schemaHash});
    if (!schema) {
        throw("schemaHash not exist!");
    }

    const issuer = await Issuer.findOne({issuerId: issuerId});
    if (!issuer) {
        throw("issuerId not exist!");
    }

    const newRegistry = new SchemaRegistry({
        id: v4(),
        schemaHash: schemaHash,
        issuerId: issuerId,
        description: description,
        expiration: expiration,
        updatable: updateble,
        endpointUrl: endpointUrl,
        isActive: true,
        network: network,
    });

    await newRegistry.save();
    return newRegistry;
}

export async function findSchemaRegistry(schemaHash: string, issuerId: string, network: string) {
    let query: any = {};
    if (schemaHash != "") {
        query["schemaHash"] = schemaHash;
    }

    if (issuerId != "") {
        query["issuerId"] = issuerId;
    }

    if (network != "") {
        query["network"] = network;
    }

    const registries = await SchemaRegistry.find(query);
    const response: Array<any> = [];
    registries.forEach(registry => {
        response.push({
            id: registry.id,
            schemaHash: registry.schemaHash,
            issuerId: registry.issuerId,
            description: registry.description,
            expiration: registry.expiration,
            updatable: registry.updatable,
            network: registry.network,
            endpointUrl: registry.endpointUrl,
            isActive: registry.isActive
        });
    })

    return response;
}

export async function updateRegistry(registryId: string, schemaHash: string, issuerId: string, description: string, expiration: number, updateble: boolean, network: string, endpointUrl: string) {
    const registry = await SchemaRegistry.findOne({id: registryId});
    if (!registry) {
        throw("registryId not exist!");
    }

    const schema = await Schema.findOne({"@hash": schemaHash});
    if (!schema) {
        throw("schemaHash not exist!");
    }

    const issuer = await Issuer.findOne({issuerId: issuerId});
    if (!issuer) {
        throw("issuerId not exist!");
    }

    registry.schemaHash = schemaHash;
    registry.issuerId = issuerId;
    registry.description = description;
    registry.expiration = expiration;
    registry.updatable = updateble;
    registry.network = network;
    registry.endpointUrl = endpointUrl;

    await registry.save();
    return registry;
}

export async function changeStatusRegistry(registryId: string, status: boolean) {
    const registry = await SchemaRegistry.findOne({id: registryId});
    if (!registry) {
        throw("registryId not exist!");
    }

    registry.isActive = status;
    await registry.save();
    return registry;
}