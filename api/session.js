const { v4: uuidv4 } = require('uuid');
const { createSession } = require('../lib/sessions');

module.exports = async function handler(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { amount } = req.body;

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            res.status(400).json({ error: 'Invalid amount. Must be a positive number.' });
            return;
        }

        const sessionId = uuidv4();
        createSession(sessionId, amount);

        // Get the host from request headers or use default
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['host'] || 'localhost:3000';
        const payUrl = `${protocol}://${host}/pay/${sessionId}`;

        res.status(200).json({
            sessionId: sessionId,
            payUrl: payUrl
        });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
