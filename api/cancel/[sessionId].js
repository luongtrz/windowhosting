const { getSession, updateSessionStatus } = require('../../lib/sessions');

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

    const { sessionId } = req.query;

    if (!sessionId) {
        res.status(400).json({ error: 'Session ID is required' });
        return;
    }

    const session = getSession(sessionId);

    if (!session) {
        res.status(404).send(getErrorHtml('Phien thanh toan khong ton tai hoac da het han.'));
        return;
    }

    if (session.status !== 'pending') {
        res.status(400).send(getErrorHtml('Phien thanh toan da duoc xu ly truoc do.'));
        return;
    }

    updateSessionStatus(sessionId, 'cancelled');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(getCancelledHtml());
};

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
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card {
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
        }
        .icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #6c757d 0%, #adb5bd 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
        }
        .icon svg {
            width: 40px;
            height: 40px;
            fill: white;
        }
        h1 {
            color: #6c757d;
            font-size: 24px;
            margin-bottom: 12px;
        }
        p {
            color: #6c757d;
            font-size: 16px;
            line-height: 1.5;
        }
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
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card {
            background: white;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
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
