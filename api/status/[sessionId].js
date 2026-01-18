const { getSession } = require('../../lib/sessions');

module.exports = async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { sessionId } = req.query;

    if (!sessionId) {
        res.status(400).json({ error: 'Session ID is required' });
        return;
    }

    const session = getSession(sessionId);

    if (!session) {
        res.status(404).json({ error: 'Session not found or expired' });
        return;
    }

    res.status(200).json({
        status: session.status
    });
};
