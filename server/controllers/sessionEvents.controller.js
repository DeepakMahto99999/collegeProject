import Session from "../models/Session.model.js";
import SessionEvent from "../models/SessionEvent.model.js";

// 🔥 IMPORTANT: copy same expiry enforcer logic
function enforceRecoveryIfExpired(session) {
    if (
        session.recoveryActive &&
        session.recoveryWindowEndsAt &&
        Date.now() > session.recoveryWindowEndsAt.getTime()
    ) {
        session.status = "INVALID";
        session.invalidReason = "TOPIC_MISMATCH";
        session.recoveryActive = false;
        session.recoveryWindowEndsAt = null;
    }
}

export const handleSessionEvent = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { sessionId } = req.params;
        const { eventId, type, clientTimestamp } = req.body;

        const session = await Session.findOne({ _id: sessionId, userId });

        if (!session) {
            return res.status(400).json({ success: false });
        }

        // 🔥 Enforce recovery expiry first
        enforceRecoveryIfExpired(session);

        if (session.status === "INVALID") {
            await session.save();
            return res.json({
                success: true,
                status: session.status,
                invalidReason: session.invalidReason
            });
        }

        if (session.status !== "RUNNING") {
            return res.json({ success: true });
        }

        // 🔒 Prevent duplicate events
        const existing = await SessionEvent.findOne({ eventId });
        if (existing) {
            return res.json({ success: true });
        }

        const now = new Date();

        // Save event log
        await SessionEvent.create({
            sessionId,
            userId,
            eventId,
            type,
            clientTimestamp,
            serverTimestamp: now
        });

        switch (type) {

            case "TAB_HIDDEN_START":
                session.lastHiddenStart = now;
                break;

            case "TAB_HIDDEN_END":
                handleTabHiddenEnd(session, now);
                break;

            case "PAUSE_START":
                session.lastPauseStart = now;
                break;

            case "PAUSE_END":
                handlePauseEnd(session, now);
                break;

            default:
                break;
        }

        await session.save();

        return res.json({
            success: true,
            status: session.status,
            invalidReason: session.invalidReason
        });

    } catch (err) {
        console.error("SessionEvent error:", err);
        return res.status(500).json({ success: false });
    }
};


function handleTabHiddenEnd(session, now) {
    if (!session.lastHiddenStart) return;

    const hiddenSeconds = Math.floor(
        (now.getTime() - session.lastHiddenStart.getTime()) / 1000
    );

    session.totalHiddenSeconds += hiddenSeconds;
    session.hiddenEventCount += 1;
    session.lastHiddenStart = null;

    const maxAllowed = session.focusLength * 60 * 0.2;

    if (session.totalHiddenSeconds > maxAllowed) {
        session.status = "INVALID";
        session.invalidReason = "EXCESSIVE_TAB_AWAY";
    }
}


function handlePauseEnd(session, now) {
  if (!session.lastPauseStart) return;

  const pauseSeconds = Math.floor(
    (now.getTime() - session.lastPauseStart.getTime()) / 1000
  );

  session.totalPauseSeconds += pauseSeconds;
  session.pauseEventCount += 1;
  session.lastPauseStart = null;

  const maxAllowed = session.focusLength * 60 * 0.2;

  if (session.totalPauseSeconds > maxAllowed) {
    session.status = "INVALID";
    session.invalidReason = "PAUSE_ABUSE";
  }
}