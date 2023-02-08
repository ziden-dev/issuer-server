import { GlobalVariables } from "./common/config/global.js";
import { claim as zidenjsClaim, utils as zidenjsUtils } from "zidenjs";
import { PASSWORD } from "./common/config/secrets.js";
import axios from "axios";
import { readFileSync, writeFileSync } from "fs";
import { getCountryCode, serializaData } from "./util/utils.js";


enum SchemaPropertyType {
    str = "std:str",
    int =  "std:int",
    double = "std:double",
    obj = "std:obj",
    bool = "std:bool",
    date = "std:date"
  }
  
  enum Type {
    str = "std:str",
    int =  "std:int",
    double = "std:double",
    obj = "std:obj",
    bool = "std:bool",
    date = "std:date"
  }
  
  enum Slot {
    val1 = "std-pos:val-1",
    val2 = "std-pos:val-2",
    idx1 = "std-pos:idx-1",
    idx2 = "std-pos:idx-2",
  }

  function checkInEnum(x: any, y: any) {
    return Object.values(y).includes(x as typeof y);
  }
  
export function getInputSchema(schema: any) {
try {
    let primitiveSchema: any = {
    "@name": schema["@name"],
    "@id": schema["@id"],
    "@hash": schema["@hash"]
    };

    const schemaRaw: any = schema;

    const listContext = schema["@context"];
    let map: any = {};

    listContext.forEach((context: any) => {
        const keys = Object.keys(context);
        const id = context["@id"];
        if (!id) {
            return;
        }
        keys.forEach((key: string) => {
            if (!key || key[0] == '@') {
                return;
            }
            map[id + ":" + key] = context[key];
        });
    });

    const keys = Object.keys(schemaRaw);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key[0] == '@' || key == "_doc") {
            continue;
        }
        let obj = schemaRaw[key];
        let type = obj["@type"];
        let id = obj["@id"];
        if (!type || !id) {
            continue;
        }

        while (!checkInEnum(type, SchemaPropertyType)) {
            const context = map[type];
            if (!context || !context["@type"]) {
                break;
            }
            type = context["@type"];
            obj = context;
        }
        obj["@id"] = id;
        if (checkInEnum(type, SchemaPropertyType)) {
            if (type != SchemaPropertyType.obj) {
                primitiveSchema[key] = obj;
            } else {
                let objValue: any = {};
                objValue["@id"] = id;
                const keys = Object.keys(obj);
                keys.forEach((key) => {
                    if (key[0] == '@') {
                        objValue[key] = obj[key];
                    } else {
                        let typeValue = obj[key]["@type"];
                        if (!typeValue) {
                            return;
                        }
                        if (checkInEnum(typeValue, SchemaPropertyType)) {
                            objValue[key] = obj[key];
                        } else {
                            let objValProperty: any = {};
                            while(!checkInEnum(typeValue, SchemaPropertyType)) {
                                const subContext = map[typeValue];
                                console.log(typeValue)
                                if (!subContext["@type"]) {
                                    break;
                                }
                                typeValue = subContext["@type"];
                                objValProperty = subContext;
                            }

                            if (checkInEnum(typeValue, SchemaPropertyType)) {
                                objValue[key] = objValProperty;
                            }
                        }
                    }
                });
                primitiveSchema[key] = objValue;
            }
        }
    }
    return primitiveSchema;
} catch (err) {
    console.log(err)
    throw("Invalid schema!");
}
}


const contextExample = {
"@name": "exmple context",
"@type": "context",
"@id": "ex",
"@context": [],
"name": {
    "@type": "std:str"
},
"address": {
    "@type": "std:obj",
    "first": {
    "@type": "std:str"
    },
    "second": {
    "@type": "std:int"
    }
},
"gender": {
    "@type": "std:int",
    "@values": [0, 1, 2],
    "@display": ["male", "female", "others"]
}
}

const schemaExample = {
"@name": "schema example",
"@type": "schema",
"@id": "schema1",
"@context": [contextExample],
"@hash": "1234124",
"name": {
    "@id": "std-pos:val-2",
    "@type": "ex:name"
},
"address-test": {
    "@id": "std-pos:val-1",
    "@type": "ex:address"
},
"gender-test": {
    "@id": "std-pos:idx-1",
    "@type": "ex:gender"
}
}

export function schemaPropertiesSlot(schemaRaw: any) {
    try {
      let propertiesSlot: any = {};
  
      const schema = getInputSchema(schemaRaw);
      const propertiesKey = Object.keys(schema);
  
      let bitStart = [0, 0, 0, 0, 0, 0, 0, 0];
  
      propertiesKey.forEach(key => {
        if (key[0] == '@') {
          return;        
        }
  
        const property = schema[key];
        const propertyType = property["@type"];
        const propertyId = property["@id"];
  
        if (!propertyType || !propertyId || !checkInEnum(propertyId, Slot) || !checkInEnum(propertyType, Type)) {
          return;
        }
  
        let slot = 0;
        switch(propertyId) {
          case Slot.idx1:
            slot = 2;
            break;
          case Slot.idx2:
            slot = 3;
            break;
          case Slot.val1:
            slot = 6;
            break;
          case Slot.val2:
            slot = 7;
            break;
        }
  
        if (propertyType == Type.obj) {
          propertiesSlot[key] = {};
          const keysProp = Object.keys(property);
          keysProp.forEach(keyProp => {
            let type = property[keyProp]["@type"];
            if (!type || keyProp[0] == '@') {
              return
            }
            let size = getBitFromType(type);
            if (size > 0) {
              if (bitStart[slot] + size > 253) {
                throw("Schema too large!");
              }
              propertiesSlot[key][keyProp] = {
                type: type,
                slot: slot,
                begin: bitStart[slot],
                end: bitStart[slot] + size - 1
              };
              bitStart[slot] += size;
            }
          })
        }
        else {
          let size = getBitFromType(propertyType);
          if (size > 0) {
            if (bitStart[slot] + size > 253) {
              throw("Schema too large!");
            }
            propertiesSlot[key] = {
              type: propertyType,
              slot: slot,
              begin: bitStart[slot],
              end: bitStart[slot] + size - 1
            };
            bitStart[slot] += size;
          }
        }
      });
  
      return propertiesSlot;
  
    } catch (err) {
      throw(err);
    }
  }

  function getBitFromType(type: string) {
    switch(type) {
      case Type.str:
        return 125;
      case Type.bool:
        return 4;
      case Type.date:
        return 32;
      case Type.int:
        return 32;
      case Type.double:
        return 64;
    }
    return 0;
  }
    
console.log(schemaPropertiesSlot(schemaExample))
