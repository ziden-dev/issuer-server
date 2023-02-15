import { global as zidenjsParams } from "zidenjs";

export class GlobalVariables {
    public static hasher: zidenjsParams.Hasher;
    public static F: zidenjsParams.SnarkField;
    public static hash0: zidenjsParams.Hash0;
    public static hash1: zidenjsParams.Hash1;
    public static hashFunction: {
        (left: BigInt, right: BigInt): BigInt;
    };
    public static eddsa: zidenjsParams.EDDSA;
    public static levelDb: any = {};

    constructor() {
    }

    public static async init(): Promise<void> {
        await zidenjsParams.setupParams();
        let params = zidenjsParams.getZidenParams();
        GlobalVariables.hasher = params.hasher;
        GlobalVariables.F = params.F;
        GlobalVariables.hash0 = params.hash0;
        GlobalVariables.hash1 = params.hash1;
        GlobalVariables.eddsa = params.eddsa;
        GlobalVariables.hashFunction = params.fmtHash;
    }
}