const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Import dedicated B52 logic
const b52h = require('./b52h_logic');
const b52md5 = require('./b52md5_logic');

const app = express();
app.use(cors());

const PORT = process.env.PORT || 5000;

// --- API B52 HŨ ---
app.get('/api/b52h/taixiu', (req, res) => {
    res.json(b52h.getCurrentData());
});

app.get('/api/b52h/history', (req, res) => {
    const limit = req.query.limit;
    res.json(b52h.getHistory(limit));
});

// --- API B52 MD5 ---
app.get('/api/b52md5/taixiu', (req, res) => {
    res.json(b52md5.getCurrentData());
});

app.get('/api/b52md5/history', (req, res) => {
    const limit = req.query.limit;
    res.json(b52md5.getHistory(limit));
});

// Landing Page
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>B52 Dedicated API</title>
                <style>
                    body { font-family: 'Segoe UI', system-ui, sans-serif; line-height: 1.6; padding: 40px; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
                    .card { max-width: 600px; width: 100%; background: #1e293b; padding: 40px; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid #334155; }
                    h1 { color: #38bdf8; text-align: center; margin-bottom: 30px; font-size: 2.2rem; font-weight: 800; letter-spacing: -0.025em; }
                    .group { margin-bottom: 24px; padding: 20px; background: #334155; border-radius: 12px; border-left: 6px solid #38bdf8; transition: transform 0.2s; }
                    .group:hover { transform: translateX(5px); }
                    h2 { color: #f1f5f9; margin-top: 0; font-size: 1.4rem; font-weight: 700; }
                    ul { list-style: none; padding: 0; margin: 15px 0 0 0; }
                    li { margin-bottom: 12px; display: flex; align-items: center; }
                    li::before { content: "→"; color: #38bdf8; margin-right: 10px; font-weight: bold; }
                    a { color: #38bdf8; text-decoration: none; font-weight: 600; font-size: 1.05rem; transition: color 0.15s; }
                    a:hover { color: #7dd3fc; }
                    .footer { font-size: 0.875rem; color: #94a3b8; text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #334155; }
                    .badge { background: #0ea5e9; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 0.7rem; margin-left: 8px; vertical-align: middle; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>🚀 B52 Dedicated API</h1>
                    <div class="group">
                        <h2>💎 B52 Hũ <span class="badge">WebSocket</span></h2>
                        <ul>
                            <li><a href="/api/b52h/taixiu">Dữ liệu hiện tại</a></li>
                            <li><a href="/api/b52h/history?limit=100">Lịch sử (Max 300)</a></li>
                        </ul>
                    </div>
                    <div class="group">
                        <h2>🛡️ B52 MD5 <span class="badge">GET API</span></h2>
                        <ul>
                            <li><a href="/api/b52md5/taixiu">Dữ liệu hiện tại</a></li>
                            <li><a href="/api/b52md5/history?limit=100">Lịch sử (Max 300)</a></li>
                        </ul>
                    </div>
                    <div class="footer">
                        ID: Dwong1410 • Status: <span style="color: #22c55e;">Online</span> • Render Ready
                    </div>
                </div>
            </body>
        </html>
    `);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[🚀] B52 Dedicated Server running http://0.0.0.0:${PORT}`);

    // Init logic
    b52h.startConnection();
    b52md5.startConnection();

    // Auto-ping cron (for Render high availability)
    const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
    if (RENDER_EXTERNAL_URL) {
        setInterval(() => {
            axios.get(RENDER_EXTERNAL_URL)
                .then(res => console.log(`[📡] Render Keep-Alive: OK (${res.status})`))
                .catch(err => console.error('[⚠️] Render Keep-Alive: Error', err.message));
        }, 5 * 60 * 1000); // 5 mins
    }
});
