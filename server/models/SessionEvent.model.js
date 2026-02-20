const sessionEventSchema = new mongoose.Schema({

    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    eventId: {
        type: String,
        required: true,
        unique: true
    },

    type: {
        type: String,
        required: true,
        enum: [
            "VIDEO_DETECTED",
            "VIDEO_AI_RESULT",
            "TAB_HIDDEN_START",
            "TAB_HIDDEN_END",
            "PAUSE_START",
            "PAUSE_END",
            "HEARTBEAT",
            "SHORTS_DETECTED"
        ]
    },

    videoId: String,
    videoTitle: String,
    videoDescription: String,

    aiRelevant: Boolean,

    aiConfidence: {
        type: Number,
        default: 0
    },

    clientTimestamp: Date,

    serverTimestamp: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true });
