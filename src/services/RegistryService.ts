import { v4 } from "uuid";
import Claim from "../models/Claim.js";
import Issuer from "../models/Issuer.js";
import Schema from "../models/Schema.js";
import SchemaRegistry from "../models/SchemaRegistry.js";

export async function createNewRegistry(schemaHash: string, issuerId: string, description: string, expiration: number, updateble: boolean, networkId: number, endpointUrl: string) {    
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

    if (networkId == undefined || networkId == null) {
        networkId = 0;
    }

    if (!endpointUrl) {
        endpointUrl = "";
    }

    if (!expiration) {
        expiration = 0;
    }

    const schema = await Schema.findOne({"@hash": schemaHash});
    let schemaName = "";
    if (schema) {
        schemaName = schema["@name"];
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
        networkId: networkId
    });

    await newRegistry.save();
    return {
        id: newRegistry.id,
        schema: {
            name: schemaName,
            hash: schemaHash
        },
        issuerId: issuerId,
        description: description,
        expiration: expiration,
        updatable: updateble,
        endpointUrl: endpointUrl,
        isActive: true,
        network: {
            networkId: 97,
            name: 'BNB Testnet'
        }
    };
}

export async function findSchemaRegistry(schemaHash: string, issuerId: string) {
    let query: any = {};
    if (schemaHash != "") {
        query["schemaHash"] = schemaHash;
    }

    if (issuerId != "") {
        query["issuerId"] = issuerId;
    }

    const registries = await SchemaRegistry.find(query);
    const response: Array<any> = [];

    for (let i = 0; i < registries.length; i++) {
        let registry = registries[i];

        const numClaims = await Claim.countDocuments({"schemaRegistryId": registry.id});
        const schema = await Schema.findOne({"@hash": registry.schemaHash});

        response.push({
            id: registry.id,
            schema: {
                name: schema!["@name"],
                hash: schema!["@hash"]
            },
            issuerId: registry.issuerId,
            description: registry.description,
            expiration: registry.expiration,
            updatable: registry.updatable,
            network: {
                networkId: 97,
                name: 'BNB Testnet'
            },
            endpointUrl: registry.endpointUrl,
            isActive: registry.isActive,
            numClaims: numClaims
        });
    }

    return response;
}


export async function findOneRegistry(registryId: string) {

    const registry = await SchemaRegistry.findOne({id: registryId});
    if (!registry) {
        throw("Registry not existed!");
    }

    const numClaims = await Claim.countDocuments({"schemaRegistryId": registry.id});
    const schema = await Schema.findOne({"@hash": registry.schemaHash});

    let response = {
        id: registry.id,
        schema: {
            name: schema!["@name"],
            hash: schema!["@hash"]
        },
        issuerId: registry.issuerId,
        description: registry.description,
        expiration: registry.expiration,
        updatable: registry.updatable,
        network: {
            networkId: 97,
            name: 'BNB Testnet'
        },
        endpointUrl: registry.endpointUrl,
        isActive: registry.isActive,
        numClaims: numClaims
    };

    return response;
}

export async function updateRegistry(registryId: string, schemaHash: string, issuerId: string, description: string, expiration: number, updateble: boolean, networkId: number, endpointUrl: string) {
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
    registry.networkId = networkId;
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