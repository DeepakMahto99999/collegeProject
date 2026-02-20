import mongoose from "mongoose";

const aiCacheSchema = new mongoose.Schema({

    videoId: {
        type: String,
        required: true,
        unique: true
    },

    topic: String,

    relevant: {
        type: Boolean,
        default: false
    },

    confidence: {
        type: Number,
        default: 0
    },

    checkedAt: {
        type: Date,
        default: Date.now
    }

});


export default mongoose.model("AiCache", aiCacheSchema)