import mongoose from "mongoose";

const Entry = new mongoose.Schema({
    claimId: String,
    entry: [String],
    rawData: String
})

export default mongoose.model("Entry", Entry);