import mongoose from "mongoose";

const Network = new mongoose.Schema({
    id: String,
    chainId: String,
    createAt: Number,
    name: String,
    shotName: String,
    updateAt: Number
})

export default mongoose.model("Network", Network);