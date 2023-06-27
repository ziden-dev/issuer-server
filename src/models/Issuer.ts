import mongoose from "mongoose";

const Issuer = new mongoose.Schema({
    issuerId: String,
    authHi: String,
    pubkeyX: String,
    pubkeyY: String,
    pathDb: String,
    privateKey: String,
    name: String,
    description: String,
    logoUrl: String
});

export default mongoose.model("Issuer", Issuer);