import mongoose from "mongoose";

const Operator = new mongoose.Schema({
    userId: String,
    role: String,
    claimId: String,
    createAt: String,
    issuerId: String,
    activate: Boolean
});

export default mongoose.model("Operator", Operator);