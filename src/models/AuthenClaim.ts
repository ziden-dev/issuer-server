import mongoose from "mongoose";

const AuthenClaim = new mongoose.Schema({
    issuerId: String,
    userId: String,
    claimId: String
});

export default mongoose.model("AuthenClaim", AuthenClaim);