import axios from "axios";
import { v4 } from "uuid";
import { SchemaPropertyId, SchemaPropertyType, SchemaType } from "../common/enum/EnumType.js";
import Schema from "../models/Schema.js";
import { checkInEnum, getSchemaHashFromSchema } from "../util/utils.js";

export async function createNewSchema(schema: any) {
    try {
        await checkValidFormSchema(schema);
        const schemaHash = getSchemaHashFromSchema(schema);

        const checkSchema = await Schema.findOne({"@hash": schemaHash});
        if (checkSchema) {
            throw("Schema existed!");
        }

        const newSchema = new Schema({
            ...schema
        });

        if (schema["@type"] == SchemaType.schema) {
            newSchema["@hash"] = schemaHash;
        }

        newSchema["@id"] = v4();

        await newSchema.save();
        return newSchema;
    } catch (err: any) {
        console.log(err);
        throw(err);
    }
}

export async function checkValidFormSchema(schema: any) {
    if (!schema || !schema["@name"] || !schema["@type"] || !schema["@context"]) {
        throw("Invalid schema");
    }

    if (typeof schema["@name"] != "string" 
        || typeof schema["@type"] != "string"
        || typeof schema["@name"] != "string"
        || !Array.isArray(schema["@context"])) {
            throw("Invalid schema");
        }
    
    let listContextUrl: Array<string> = [];
    let listContextId: Array<string> = [];
    let listContext: Array<string> = [];

    for (let i in schema["@context"]) {
        const url = schema["@context"][i];
        if (!url || typeof url != "string") {
            continue;
        }
        if (listContextUrl.includes(url)) {
            continue;
        }
        listContextUrl.push(url);
    }

    for (let i = 0; i < listContextUrl.length; i++) {
        const url = listContextUrl[i];
        try {
            const response = await axios.get(url);
            if (response.status == 200) {
                const data = await (response.data);
                if (!data["@type"] || data["@type"] != SchemaType.context) {
                    continue;
                }
                if (listContextId.includes(data["@id"])) {
                    continue;
                }
                listContext.push(data);
                listContextId.push(data["@id"]);
                for (let index in data["@context"]) {
                    const urlContext = data["@context"][index];
                    if (!urlContext || typeof urlContext != "string") {
                        continue;
                    }
                    if (listContextUrl.includes(urlContext)) {
                        continue;
                    }
                    listContextUrl.push(urlContext);
                }
            }

        } catch (err: any) {
            console.log(err);
        }
    }

    if (schema["@type"] == SchemaType.context) {
        const keys = Object.keys(schema);
        keys.forEach((key) => {
            if (key[0] != '@') {
                // key: property
                const property = schema[key];
                
                // get type
                const type = property["type"];
                if (!type || typeof type != "string") {
                    throw("Invalid type in " + key);
                }
                const arr = type.split(":");
                if (arr.length != 2) {
                    throw("Invalid type in " + key);             
                }

                let checkValidType: boolean = false;
                if (checkInEnum(type, SchemaPropertyType)) {
                    checkValidType = true;
                }
                if (!checkValidType) {
                    for (let index in listContext) {
                        if (checkAttribute(type, listContext[index])) {
                            checkValidType = true;
                            break;
                        }
                    }
                }

                if (!checkValidType) {
                    throw("Invalid type in " + key);
                }

                // get values
                const values = property["values"];
                if (!values || !Array.isArray(values)) {
                    throw("Invalid values in " + key);
                }

            }
        });
    }

    else if (schema["@type"] == SchemaType.schema) {
        const keys = Object.keys(schema);
        keys.forEach((key) => {
            if (key[0] != '@') {
                // key: property
                const property = schema[key];
                
                // get id
                const id = property["id"];
                if (!id || !checkInEnum(id, SchemaPropertyId)) {
                    throw("Invalid id in " + key);
                }
                
                // get type
                const type = property["type"];
                if (!type || typeof type != "string") {
                    throw("Invalid type in " + key);
                }
                const arr = type.split(":");
                if (arr.length != 2) {
                    throw("Invalid type in " + key);             
                }

                let checkValidType: boolean = false;
                if (checkInEnum(type, SchemaPropertyType)) {
                    checkValidType = true;
                }
                if (!checkValidType) {
                    for (let index in listContext) {
                        if (checkAttribute(type, listContext[index])) {
                            checkValidType = true;
                            break;
                        }
                    }
                }

                if (!checkValidType) {
                    throw("Invalid type in " + key);
                }
            }
        });
    }

    else {
        throw("Invalid @type in schema");
    }

}

export function checkAttribute(type: string, context: any) {
    const arr = type.split(":");
    if (arr.length != 2) {
        return false;
    }
    if (arr[0] != context["@id"]) {
        return false;
    }
    const keys = Object.keys(context);
    for (let i in keys) {
        if (keys[i] == arr[1]) {
            return true;
        }
    }
    return false;
}

export async function getAllSchema() {
    
}