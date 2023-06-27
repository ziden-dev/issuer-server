import { GlobalVariables } from "../common/config/global.js";
import {
  ISSUER_PRIVATE_KEY,
  ISSUER_SERVER_URL,
  ZIDEN_SERVER_URI,
} from "../common/config/secrets.js";
import Issuer from "../models/Issuer.js";
import { utils as zidenjsUtils } from "@zidendev/zidenjs";
import { registerIssuer } from "../services/TreeState.js";
import fs from "fs-extra";
import { createNewSchema } from "../services/Schema.js";
import { createNewRegistry } from "../services/RegistryService.js";
import SchemaRegistry from "../models/SchemaRegistry.js";
import axios from "axios";
import { saveIssuer, updateIssuer } from "../services/Issuer.js";

export async function setupIssuer() {
    const issuerProfiles = JSON.parse(
        fs.readFileSync("setup/issuer.json", "utf-8")
    );
  try {
    for (let i = 0; i < ISSUER_PRIVATE_KEY.length; i++) {
      const privateKey = ISSUER_PRIVATE_KEY[i];
      const privateKey2Buf = zidenjsUtils.hexToBuffer(privateKey, 32);

      const pubkeyX = GlobalVariables.F.toObject(
        GlobalVariables.eddsa.prv2pub(privateKey2Buf)[0]
      ).toString(10);
      const pubkeyY = GlobalVariables.F.toObject(
        GlobalVariables.eddsa.prv2pub(privateKey2Buf)[1]
      ).toString(10);
      const issuer = await Issuer.findOne({
        pubkeyX: pubkeyX,
        pubkeyY: pubkeyY,
      });
      if (!issuer) {
        await registerIssuer(privateKey, issuerProfiles[i].name, issuerProfiles[i].description, issuerProfiles[i].logoUrl);
      } else {
        await updateIssuer(issuer.issuerId!, issuer.authHi!, issuer.pubkeyX!, issuer.pubkeyY!, issuer.pathDb!, issuer.privateKey!, issuerProfiles[i].name, issuerProfiles[i].description, issuerProfiles[i].logoUrl)
      }
    }
  } catch (err) {
    console.log(err);
  }
}

export async function setupSchemaRegistry() {
  try {
    const schemaJsons = JSON.parse(
      fs.readFileSync("setup/schema.json", "utf-8")
    );
    const issuerList = await Issuer.find();
    let issuerIds = [];
    for (let i = 0; i < issuerList.length; i++) {
      if (issuerList[i].issuerId != null) {
        issuerIds.push(issuerList[i].issuerId);
      }
    }

    for (let i = 0; i < schemaJsons.length; i++) {
      const schemaJson = schemaJsons[i];
      try {
        const schema = await createNewSchema(schemaJson);

        const registry = await SchemaRegistry.findOne({
          schemaHash: schema["@hash"],
          issuerId: issuerList[i].issuerId,
        });
        if (registry != undefined) {
          continue;
        }

        await createNewRegistry(
          schema["@hash"]!,
          issuerList[i].issuerId!,
          `${schema["@name"]}`,
          30 * 24 * 60 * 60 * 60 * 1000,
          true,
          97,
          `${ISSUER_SERVER_URL}/api/v1`
        );
      } catch (err) {}
    }

    // const serviceExisted = (
    //   await axios.get(`${ZIDEN_SERVER_URI}/api/v1/services`)
    // ).data.services;
    // const services = JSON.parse(fs.readFileSync("setup/service.json", "utf-8"));
    // for (let i = 0; i < services.length; i++) {
    //   let ok = 1;
    //   for (let j = 0; j < serviceExisted.length; j++) {
    //     if (services[i].name == serviceExisted[j].name) {
    //       ok = 0;
    //       break;
    //     }
    //   }
    //   if (ok == 1) {
    //     for (let j = 0; j < services[i].requirements; j++) {
    //       if (services[i].requirements[j].allowedIssuers.length == 0) {
    //         services[i].requirements[j].allowedIssuers.length = issuerIds;
    //       }
    //     }

    //     try {
    //       await axios.request({
    //         url: `${ZIDEN_SERVER_URI}/api/v1/services`,
    //         method: "post",
    //         data: services[i],
    //       });
    //     } catch (err) {
    //       console.log(err);
    //     }
    //   }
    // }
  } catch (err) {
    console.log(err);
  }
}
