import { dbPath, levelDbSrc, levelDbSrcClone, levelDbStateBackup } from "../common/config/constant.js";
import fs from "fs-extra"

import {db as zidenjsDb} from "zidenjs";

export async function createNewLevelDb(id: string) {
    try {
        const pathLevelDb = dbPath + "/" + id;
        fs.removeSync(pathLevelDb);
        const claimsDb = new zidenjsDb.SMTLevelDb(pathLevelDb + `/${levelDbSrc}/claims`);
        const revocationDb = new zidenjsDb.SMTLevelDb(pathLevelDb + `/${levelDbSrc}/revocation`);
        const rootsDb = new zidenjsDb.SMTLevelDb(pathLevelDb + `/${levelDbSrc}/roots`);
        return {pathLevelDb, claimsDb, revocationDb, rootsDb};
    } catch (err: any) {
        throw (err);
    }
}

export async function closeLevelDb(claimsDb: zidenjsDb.SMTLevelDb, revocationDb: zidenjsDb.SMTLevelDb, rootsDb: zidenjsDb.SMTLevelDb) {
    try {
        await claimsDb.nodes.close();
        await revocationDb.nodes.close();
        await rootsDb.nodes.close();
    } catch (err: any) {
        console.log(err);
    }
    
}

export async function openLevelDb(src: string) {
    const claimsDb = new zidenjsDb.SMTLevelDb(src + `/${levelDbSrc}/claims`);
    const revocationDb = new zidenjsDb.SMTLevelDb(src + `/${levelDbSrc}/revocation`);
    const rootsDb = new zidenjsDb.SMTLevelDb(src + `/${levelDbSrc}/roots`);
    return {claimsDb, revocationDb, rootsDb};
    
}

export async function copyDb(src: string, dis: string) {
    try {
        fs.removeSync(dis);
        fs.copySync(src, dis);
    } catch (err: any) {
        throw(err);
    }
}