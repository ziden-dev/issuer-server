import mongoose from "mongoose";

const TreeState = new mongoose.Schema({
    rootsVersion: Number,
    revocationNonce: Number,
    userID: String,
    lastestRootsVersion: Number,
    lastestRevocationNonce: Number,
    isLockPublish: Boolean
});

export default mongoose.model("TreeState", TreeState);