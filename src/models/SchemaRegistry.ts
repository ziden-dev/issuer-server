import mongoose from "mongoose";

const SchemaRegistry = new mongoose.Schema({
    schemaHash: String,
    description: String,
    expiration: Number,
    updatable: Boolean,
    network: String,
    endpointUrl: String
})

export default mongoose.model("SchemaRegistry", SchemaRegistry);