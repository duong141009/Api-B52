const WebSocket = require('ws');
const crypto = require('crypto');

// Configuration
const ACCESS_TOKEN = "13-458ae715094ab03c60ff3fa370f17688";

// Connection state
let ws = null;
let pingInterval = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;
let isConnected = false;
let isConnecting = false;
let lastActivityTime = Date.now();

// Game data
let patternHistory = [];
let fullHistory = [];
let currentSid = null;
let currentData = null;
const processedSid = new Set();

// Memory management: Clear sets every 1 hour to prevent leaks
setInterval(() => {
    processedSid.clear();
}, 6 * 60 * 60 * 1000);

// Utility functions
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateFingerprint() {
    return crypto.randomBytes(16).toString('hex');
}

function getCurrentTime() {
    return new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
}

function safeSend(message) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return false;
    try {
        ws.send(JSON.stringify(message));
        lastActivityTime = Date.now();
        return true;
    } catch (e) {
        return false;
    }
}

// WebSocket connection manager
function connectWebSocket() {
    if (isConnected || isConnecting) return;

    isConnecting = true;
    reconnectAttempts++;

    // Create new connection
    ws = new WebSocket("wss://minybordergs.weskb5gams.net/websocket", {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Origin": "https://i.b52.club",
            "Host": "minybordergs.weskb5gams.net",
            "X-Client-Fingerprint": generateFingerprint()
        }
    });

    // Connection established
    ws.on('open', () => {
        isConnected = true;
        isConnecting = false;
        reconnectAttempts = 0;
        lastActivityTime = Date.now();
        console.log(`[${getCurrentTime()}] ✅ B52 Hũ kết nối thành công`);

        const initialMessages = [
            [1, "MiniGame", "", "", {
                agentId: "1",
                accessToken: ACCESS_TOKEN,
                reconnect: false
            }],
            [6, "MiniGame", "taixiuKCBPlugin", { cmd: 2000 }]
        ];

        initialMessages.forEach((msg, i) => {
            setTimeout(() => {
                safeSend(msg);
            }, 500 * (i + 1));
        });

        setupKeepAlive();
    });

    // Message received
    ws.on('message', (data) => {
        lastActivityTime = Date.now();

        try {
            const json = JSON.parse(data);
            if (Array.isArray(json) && json[1]?.htr) {
                const htr = json[1].htr;
                const latest = htr[htr.length - 1];

                if (latest && latest.sid && !processedSid.has(latest.sid) && latest.d1 !== undefined) {
                    const sid = latest.sid;
                    processedSid.add(sid);
                    currentSid = sid;

                    const { d1, d2, d3 } = latest;
                    const total = d1 + d2 + d3;
                    const resultChar = total > 10 ? "T" : "X";

                    patternHistory.push(resultChar);
                    if (patternHistory.length > 20) patternHistory.shift();

                    const pattern = patternHistory.join("").toLowerCase();

                    currentData = {
                        "Phiên trước": sid,
                        "xúc xắc 1": d1,
                        "xúc xắc 2": d2,
                        "xúc xắc 3": d3,
                        "kết quả": total,
                        "pattern": pattern,
                        "phiên hiện tại": sid + 1,
                        "time": getCurrentTime(),
                        "id": "Dwong1410"
                    };

                    fullHistory.push(currentData);
                    if (fullHistory.length > 300) fullHistory.shift();

                    console.log(`[${getCurrentTime()}] 🎲 B52 Hũ: Phiên ${sid} ➜ ${d1}-${d2}-${d3} = ${total}`);
                }
            }
        } catch (e) {
            console.log(`[${getCurrentTime()}] ❌ Lỗi xử lý message:`, e.message);
        }
    });

    // Connection closed
    ws.on('close', () => {
        isConnected = false;
        isConnecting = false;
        if (pingInterval) clearInterval(pingInterval);
        const delay = Math.min(15000, 2000 * Math.pow(2, reconnectAttempts));
        reconnectTimeout = setTimeout(connectWebSocket, delay);
    });

    // Connection error
    ws.on('error', (err) => {
        isConnecting = false;
    });
}

// Keep-alive mechanism
function setupKeepAlive() {
    if (pingInterval) clearInterval(pingInterval);

    let counter = 1;
    pingInterval = setInterval(() => {
        if (!isConnected) return;
        safeSend(["7", "MiniGame", "1", counter++]);
        if (counter % 3 === 0) {
            safeSend([6, "MiniGame", "taixiuKCBPlugin", { cmd: 2000 }]);
        }
    }, 10000);
}

// Exports cho server.js
module.exports = {
    getCurrentData: () => currentData || {
        status: "waiting",
        message: "Đang chờ dữ liệu B52 Hũ...",
        time: getCurrentTime()
    },
    getHistory: (limitStr) => {
        let limit = fullHistory.length;
        if (limitStr) {
            const parsedLimit = parseInt(limitStr);
            if (!isNaN(parsedLimit) && parsedLimit > 0) {
                limit = Math.min(parsedLimit, 300, fullHistory.length);
            }
        } else {
            limit = Math.min(300, fullHistory.length);
        }
        return fullHistory.slice(-limit);
    },
    startConnection: () => {
        connectWebSocket();
        setInterval(() => {
            if (isConnected && Date.now() - lastActivityTime > 45000) {
                if (ws) ws.terminate();
            }
        }, 10000);
    }
};
