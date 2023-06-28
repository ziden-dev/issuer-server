import mongoose from "mongoose";

const SchemaRegistry = new mongoose.Schema({
    id: String,
    schemaHash: String,
    issuerId: String,
    description: String,
    expiration: Number,
    updatable: Boolean,
    networkId: Number,
    endpointUrl: String,
    isActive: Boolean
})

export default mongoose.model("SchemaRegistry", SchemaRegistry);