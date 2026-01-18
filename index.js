const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session storage
const sessions = new Map();
const SESSION_TTL = 10 * 60 * 1000; // 10 minutes

// Cleanup expired sessions
setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
        if (now - session.createdAt > SESSION_TTL) {
            sessions.delete(id);
        }
    }
}, 60 * 1000);

// Helper: Format VND
function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount);
}

// ============================================
// API ENDPOINTS
// ============================================

// POST /api/session - Create new payment session
app.post('/api/session', (req, res) => {
    const { amount } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount. Must be a positive number.' });
    }

    const sessionId = uuidv4();
    sessions.set(sessionId, {
        id: sessionId,
        amount: amount,
        status: 'pending',
        createdAt: Date.now()
    });

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['host'] || 'localhost:3000';
    const payUrl = `${protocol}://${host}/pay/${sessionId}`;

    res.json({ sessionId, payUrl });
});

// GET /api/status/:sessionId - Check payment status
app.get('/api/status/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
        return res.status(404).json({ error: 'Session not found or expired' });
    }

    res.json({ status: session.status });
});

// POST /api/confirm/:sessionId - Confirm payment
app.post('/api/confirm/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
        return res.status(404).send(getErrorHtml('Phien thanh toan khong ton tai hoac da het han.'));
    }

    if (session.status !== 'pending') {
        return res.status(400).send(getErrorHtml('Phien thanh toan da duoc xu ly truoc do.'));
    }

    session.status = 'success';
    res.send(getSuccessHtml());
});

// POST /api/cancel/:sessionId - Cancel payment
app.post('/api/cancel/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
        return res.status(404).send(getErrorHtml('Phien thanh toan khong ton tai hoac da het han.'));
    }

    if (session.status !== 'pending') {
        return res.status(400).send(getErrorHtml('Phien thanh toan da duoc xu ly truoc do.'));
    }

    session.status = 'cancelled';
    res.send(getCancelledHtml());
});

// GET /pay/:sessionId - Payment page
app.get('/pay/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
        return res.status(404).send(getExpiredHtml());
    }

    if (session.status !== 'pending') {
        return res.send(getProcessedHtml(session.status));
    }

    res.send(getPaymentHtml(session.amount, sessionId));
});

// ============================================
// HTML TEMPLATES
// ============================================

function getPaymentHtml(amount, sessionId) {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thanh toan MoMo</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(180deg, #A50064 0%, #7B004B 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card {
            background: white;
            border-radius: 24px;
            padding: 32px 24px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 380px;
            width: 100%;
        }
        .logo { width: 72px; height: 72px; margin: 0 auto 20px; }
        .logo img { width: 100%; height: 100%; object-fit: contain; }
        h1 { color: #A50064; font-size: 22px; font-weight: 700; margin-bottom: 8px; }
        .subtitle { color: #666; font-size: 14px; margin-bottom: 24px; }
        .amount-label { color: #888; font-size: 14px; margin-bottom: 8px; }
        .amount { font-size: 36px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; }
        .currency { color: #666; font-size: 14px; margin-bottom: 32px; }
        .divider { height: 1px; background: #eee; margin: 24px 0; }
        .btn {
            width: 100%; padding: 16px 24px; border: none; border-radius: 12px;
            font-size: 16px; font-weight: 600; cursor: pointer;
            transition: all 0.2s ease; margin-bottom: 12px;
        }
        .btn:active { transform: scale(0.98); }
        .btn-confirm {
            background: linear-gradient(135deg, #A50064 0%, #D6006F 100%);
            color: white; box-shadow: 0 4px 15px rgba(165, 0, 100, 0.4);
        }
        .btn-confirm:hover { background: linear-gradient(135deg, #8A0054 0%, #B8005F 100%); }
        .btn-cancel { background: #f0f0f0; color: #666; }
        .btn-cancel:hover { background: #e5e5e5; }
        .security-note { margin-top: 20px; font-size: 12px; color: #999; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">
            <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="MoMo Logo" />
        </div>
        <h1>Thanh toan MoMo</h1>
        <p class="subtitle">Don hang tu MyShop</p>
        
        <p class="amount-label">So tien thanh toan</p>
        <p class="amount">${formatVND(amount)}</p>
        <p class="currency">VND</p>
        
        <div class="divider"></div>
        
        <form action="/api/confirm/${sessionId}" method="POST">
            <button class="btn btn-confirm" type="submit">Xac nhan thanh toan</button>
        </form>
        <form action="/api/cancel/${sessionId}" method="POST">
            <button class="btn btn-cancel" type="submit">Huy</button>
        </form>
        
        <p class="security-note">Giao dich duoc bao mat boi MoMo</p>
    </div>
</body>
</html>`;
}

function getSuccessHtml() {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thanh toan thanh cong</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .card {
            background: white; border-radius: 20px; padding: 40px; text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 400px; width: 100%;
        }
        .icon {
            width: 80px; height: 80px;
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            margin: 0 auto 24px;
        }
        .icon svg { width: 40px; height: 40px; fill: white; }
        h1 { color: #28a745; font-size: 24px; margin-bottom: 12px; }
        p { color: #6c757d; font-size: 16px; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        </div>
        <h1>Thanh toan thanh cong!</h1>
        <p>Giao dich cua ban da duoc xu ly.<br>Ban co the dong tab nay.</p>
    </div>
</body>
</html>`;
}

function getCancelledHtml() {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Da huy thanh toan</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .card {
            background: white; border-radius: 20px; padding: 40px; text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 400px; width: 100%;
        }
        .icon {
            width: 80px; height: 80px;
            background: linear-gradient(135deg, #6c757d 0%, #adb5bd 100%);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            margin: 0 auto 24px;
        }
        .icon svg { width: 40px; height: 40px; fill: white; }
        h1 { color: #6c757d; font-size: 24px; margin-bottom: 12px; }
        p { color: #6c757d; font-size: 16px; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </div>
        <h1>Da huy thanh toan</h1>
        <p>Giao dich cua ban da bi huy.<br>Ban co the dong tab nay.</p>
    </div>
</body>
</html>`;
}

function getExpiredHtml() {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phien het han</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(180deg, #A50064 0%, #7B004B 100%);
            min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .card {
            background: white; border-radius: 24px; padding: 40px; text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 380px; width: 100%;
        }
        h1 { color: #dc3545; font-size: 22px; margin-bottom: 12px; }
        p { color: #666; font-size: 15px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Phien thanh toan het han</h1>
        <p>Vui long tao giao dich moi tu ung dung.</p>
    </div>
</body>
</html>`;
}

function getProcessedHtml(status) {
    const isSuccess = status === 'success';
    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Giao dich da xu ly</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(180deg, #A50064 0%, #7B004B 100%);
            min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .card {
            background: white; border-radius: 24px; padding: 40px; text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 380px; width: 100%;
        }
        h1 { color: ${isSuccess ? '#28a745' : '#6c757d'}; font-size: 22px; margin-bottom: 12px; }
        p { color: #666; font-size: 15px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>${isSuccess ? 'Giao dich da thanh cong' : 'Giao dich da bi huy'}</h1>
        <p>Phien thanh toan nay da duoc xu ly truoc do.</p>
    </div>
</body>
</html>`;
}

function getErrorHtml(message) {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Loi</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(180deg, #A50064 0%, #7B004B 100%);
            min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .card {
            background: white; border-radius: 24px; padding: 40px; text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 380px; width: 100%;
        }
        h1 { color: #dc3545; font-size: 20px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>${message}</h1>
    </div>
</body>
</html>`;
}

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`MoMo Payment Server running on port ${PORT}`);
});

// Export for Vercel
module.exports = app;
