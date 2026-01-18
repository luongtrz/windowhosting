const { getSession } = require('../../lib/sessions');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { sessionId } = req.query;

    if (!sessionId) {
        res.status(400).send(getErrorHtml('Session ID is required'));
        return;
    }

    const session = getSession(sessionId);

    if (!session) {
        res.status(404).send(getExpiredHtml());
        return;
    }

    if (session.status !== 'pending') {
        res.status(400).send(getProcessedHtml(session.status));
        return;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(getPaymentHtml(session.amount, sessionId));
};

function formatVND(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount);
}

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
        .logo {
            width: 72px;
            height: 72px;
            margin: 0 auto 20px;
        }
        .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        h1 {
            color: #A50064;
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        .subtitle {
            color: #666;
            font-size: 14px;
            margin-bottom: 24px;
        }
        .amount-label {
            color: #888;
            font-size: 14px;
            margin-bottom: 8px;
        }
        .amount {
            font-size: 36px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 8px;
        }
        .currency {
            color: #666;
            font-size: 14px;
            margin-bottom: 32px;
        }
        .divider {
            height: 1px;
            background: #eee;
            margin: 24px 0;
        }
        .btn {
            width: 100%;
            padding: 16px 24px;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 12px;
        }
        .btn:active {
            transform: scale(0.98);
        }
        .btn-confirm {
            background: linear-gradient(135deg, #A50064 0%, #D6006F 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(165, 0, 100, 0.4);
        }
        .btn-confirm:hover {
            background: linear-gradient(135deg, #8A0054 0%, #B8005F 100%);
        }
        .btn-cancel {
            background: #f0f0f0;
            color: #666;
        }
        .btn-cancel:hover {
            background: #e5e5e5;
        }
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        .security-note {
            margin-top: 20px;
            font-size: 12px;
            color: #999;
        }
        .loading {
            display: none;
        }
        .loading.show {
            display: inline-block;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #fff;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-right: 8px;
            vertical-align: middle;
        }
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
        
        <button class="btn btn-confirm" id="confirmBtn" onclick="confirmPayment()">
            <span class="loading" id="confirmLoading"><span class="spinner"></span></span>
            <span id="confirmText">Xac nhan thanh toan</span>
        </button>
        
        <button class="btn btn-cancel" id="cancelBtn" onclick="cancelPayment()">
            Huy
        </button>
        
        <p class="security-note">Giao dich duoc bao mat boi MoMo</p>
    </div>

    <script>
        const sessionId = '${sessionId}';
        
        function setLoading(isConfirm, loading) {
            const btn = document.getElementById(isConfirm ? 'confirmBtn' : 'cancelBtn');
            const loadingEl = document.getElementById('confirmLoading');
            const textEl = document.getElementById('confirmText');
            
            btn.disabled = loading;
            document.getElementById('cancelBtn').disabled = loading;
            document.getElementById('confirmBtn').disabled = loading;
            
            if (isConfirm) {
                loadingEl.classList.toggle('show', loading);
            }
        }
        
        async function confirmPayment() {
            setLoading(true, true);
            try {
                const response = await fetch('/api/confirm/' + sessionId, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (response.ok) {
                    const html = await response.text();
                    document.open();
                    document.write(html);
                    document.close();
                } else {
                    alert('Co loi xay ra. Vui long thu lai.');
                    setLoading(true, false);
                }
            } catch (error) {
                alert('Khong the ket noi. Vui long thu lai.');
                setLoading(true, false);
            }
        }
        
        async function cancelPayment() {
            setLoading(false, true);
            try {
                const response = await fetch('/api/cancel/' + sessionId, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (response.ok) {
                    const html = await response.text();
                    document.open();
                    document.write(html);
                    document.close();
                } else {
                    alert('Co loi xay ra. Vui long thu lai.');
                    setLoading(false, false);
                }
            } catch (error) {
                alert('Khong the ket noi. Vui long thu lai.');
                setLoading(false, false);
            }
        }
    </script>
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
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card {
            background: white;
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 380px;
            width: 100%;
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
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card {
            background: white;
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 380px;
            width: 100%;
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
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card {
            background: white;
            border-radius: 24px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 380px;
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
