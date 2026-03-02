const express = require('express');
const cors = require('cors');
const axios = require('axios');

// Import logic files
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

// Màn hình chính
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>B52 API Tool</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; padding: 20px; background: #0f172a; color: #f8fafc; }
                    .container { max-width: 650px; margin: 50px auto; background: #1e293b; padding: 30px; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #334155; }
                    h1 { color: #38bdf8; text-align: center; margin-bottom: 30px; font-size: 2rem; }
                    .group { margin-bottom: 25px; padding: 20px; background: #334155; border-radius: 8px; border-left: 5px solid #38bdf8; }
                    h2 { color: #f1f5f9; margin-top: 0; font-size: 1.25rem; }
                    ul { list-style: none; padding: 0; }
                    li { margin-bottom: 10px; }
                    a { color: #38bdf8; text-decoration: none; font-weight: 500; transition: color 0.2s; }
                    a:hover { color: #7dd3fc; text-decoration: underline; }
                    .status { font-size: 0.875rem; color: #94a3b8; text-align: center; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚀 B52 Consolidated API</h1>
                    <div class="group">
                        <h2>💎 B52 Hũ (WebSocket)</h2>
                        <ul>
                            <li><a href="/api/b52h/taixiu">Dữ liệu hiện tại</a></li>
                            <li><a href="/api/b52h/history?limit=100">Lịch sử (100 phiên)</a></li>
                        </ul>
                    </div>
                    <div class="group">
                        <h2>🛡️ B52 MD5 (GET API)</h2>
                        <ul>
                            <li><a href="/api/b52md5/taixiu">Dữ liệu hiện tại</a></li>
                            <li><a href="/api/b52md5/history?limit=100">Lịch sử (100 phiên)</a></li>
                        </ul>
                    </div>
                    <div class="status">ID: Dwong1410 | Status: Online</div>
                </div>
            </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`[🚀] B52 API Server đang chạy tại http://localhost:${PORT}`);

    // Khởi động kết nối
    b52h.startConnection();
    b52md5.startConnection();

    // Tự ping để chống ngủ (Render)
    const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
    if (RENDER_EXTERNAL_URL) {
        setInterval(() => {
            axios.get(RENDER_EXTERNAL_URL)
                .then(res => {
                    console.log(`[📡] Tự ping (status: ${res.status})`);
                })
                .catch(err => {
                    console.error('[⚠️] Lỗi tự ping:', err.message);
                });
        }, 5 * 60 * 1000); // 5 phút/lần
    } else {
        console.log('[ℹ️] Cấu hình RENDER_EXTERNAL_URL tại Render để server không bị ngủ.');
    }
});
