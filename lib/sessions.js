// In-memory session storage with auto-cleanup
// Note: Sessions will reset on cold starts in serverless environment
// Using global to persist across warm instances in Vercel

// Use global variable to persist sessions across function invocations
if (!global._sessions) {
    global._sessions = new Map();
}
const sessions = global._sessions;

// Session TTL: 10 minutes
const SESSION_TTL = 10 * 60 * 1000;

// Cleanup expired sessions periodically
function cleanupExpiredSessions() {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
        if (now - session.createdAt > SESSION_TTL) {
            sessions.delete(id);
        }
    }
}

// Run cleanup every minute
setInterval(cleanupExpiredSessions, 60 * 1000);

/**
 * Create a new payment session
 * @param {string} sessionId - UUID for the session
 * @param {number} amount - Payment amount in VND
 * @returns {object} - Created session object
 */
function createSession(sessionId, amount) {
    const session = {
        id: sessionId,
        amount: amount,
        status: 'pending',
        createdAt: Date.now()
    };
    sessions.set(sessionId, session);
    return session;
}

/**
 * Get session by ID
 * @param {string} sessionId - Session UUID
 * @returns {object|null} - Session object or null if not found/expired
 */
function getSession(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return null;

    // Check if expired
    if (Date.now() - session.createdAt > SESSION_TTL) {
        sessions.delete(sessionId);
        return null;
    }

    return session;
}

/**
 * Update session status
 * @param {string} sessionId - Session UUID
 * @param {string} status - New status: 'success' or 'cancelled'
 * @returns {boolean} - True if updated, false if session not found
 */
function updateSessionStatus(sessionId, status) {
    const session = sessions.get(sessionId);
    if (!session) return false;

    session.status = status;
    session.updatedAt = Date.now();
    return true;
}

module.exports = {
    createSession,
    getSession,
    updateSessionStatus
};
