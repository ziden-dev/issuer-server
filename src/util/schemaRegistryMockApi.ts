import axios from "axios";
import { getSchemaRegistryApi } from "../common/config/constant.js";
import { ZIDEN_SERVER_URI } from "../common/config/secrets.js";
import { schema as zidenjsSchema} from "zidenjs";
import request from "request-promise";

export async function getSchemaRegistry(schemaHash: string, issuerId: string): Promise< {schemaForm: zidenjsSchema.Schema, registryForm: zidenjsSchema.Registry } > {
//   let url = ZIDEN_SERVER_URI + getSchemaRegistryApi + schemaHash + '-' + issuerId;

    issuerId = "302fb7f59ef0eb16a9bd9a1dc7412ce0b59208a0974d525cd0f91318b00000";
    let url = ZIDEN_SERVER_URI + getSchemaRegistryApi + "?schemaHash=" + schemaHash + "&issuerId=" + issuerId;
    console.log(url);
    // const data = (await (await axios.get(url)).data);
    const data = await request({
        method: "GET",
        url: url
    });
    let registry = JSON.parse(data)["registries"][0];
    let {schema} = registry;
    // console.log(registry);
    // console.log(schema);
    return {schemaForm: schema, registryForm: registry};
}