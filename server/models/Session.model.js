const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  
  topic: {
    type: String,
    required: true,
  },

  focusLength: {
    type: Number, // minutes
    required: true
  },

  status: {
    type: String,
    enum: ["ARMED", "RUNNING", "COMPLETED", "INVALID"],
    default: "ARMED",
  },

  // TIMER TRUST MODEL
  timerStartTime: Date,
  timerExpectedEndTime: Date,
  lastHeartbeatAt: Date,

  // VIDEO CONTEXT
  activeVideoId: String,

  // SERVER CALCULATED TIME (SECONDS)
  totalFocusSeconds: {
    type: Number,
    default: 0
  },

  // TAB ABUSE TRACKING
  totalHiddenSeconds: { type: Number, default: 0 },
  hiddenEventCount: { type: Number, default: 0 },
  lastHiddenStart: Date,

  // PAUSE ABUSE TRACKING
  totalPauseSeconds: { type: Number, default: 0 },
  pauseEventCount: { type: Number, default: 0 },
  lastPauseStart: Date,

  // AI VALIDITY
  aiConfidenceAverage: Number,

  completed: {
    type: Boolean,
    default: false,
  },


  invalidReason: {
    type: String,
    enum: [
      "TOPIC_MISMATCH",
      "TAB_ABUSE",
      " SHORTS",
      "MANUAL_CANCEL",
      "AI_LOW_CONFIDENCE",
      "NETWORK_ABORT",
    ]
  },

}, { timestamps: true });
