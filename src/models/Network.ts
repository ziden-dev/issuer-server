import mongoose from "mongoose";

const Network = new mongoose.Schema({
    chainId: String,
    createAt: Number,
    name: String,
    shotName: String,
    updateAt: Number
})

export default mongoose.model("Network", Network);