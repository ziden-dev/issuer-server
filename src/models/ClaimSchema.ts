import mongoose from "mongoose";

const ClaimSchema = new mongoose.Schema({
    userId: {
        type: String
    },
    schemaName: {
        type: String
    },
    schemaHash: {
        type: String,
        unique: true
    },
    properties: {
        indexes: [
            {
                name: {type: String},
                typeData: {type: String},
                slot: {type: String}
            }
        ],
        values: [
            {
                name: {type: String},
                typeData: {type: String},
                slot: {type: String}
            }
        ]
    }
});

export default mongoose.model("ClaimSchema", ClaimSchema);