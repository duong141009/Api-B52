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
let history = [];
let fullHistory = [];
let currentSid = null;
let currentData = null;
const processedSid = new Set();

// Memory management
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

    ws = new WebSocket("wss://minybordergs.weskb5gams.net/websocket", {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Origin": "https://i.b52.club",
            "Host": "minybordergs.weskb5gams.net",
            "X-Client-Fingerprint": generateFingerprint()
        }
    });

    ws.on('open', () => {
        isConnected = true;
        isConnecting = false;
        reconnectAttempts = 0;
        lastActivityTime = Date.now();
        console.log(`[${getCurrentTime()}] ✅ B52 MD5: Đã kết nối`);

        // Init commands for MD5
        const initialMessages = [
            [1, "MiniGame", "", "", {
                agentId: "1",
                accessToken: ACCESS_TOKEN,
                reconnect: false
            }],
            [6, "MiniGame", "taixiuKCBPlugin", { cmd: 2000 }],
            [6, "MiniGame", "taixiuPlugin", { cmd: 1005 }]
        ];

        initialMessages.forEach((msg, i) => {
            setTimeout(() => {
                safeSend(msg);
            }, 500 * (i + 1));
        });

        setupKeepAlive();
    });

    ws.on('message', (data) => {
        lastActivityTime = Date.now();
        try {
            const json = JSON.parse(data);
            // Only process messages from MD5 (taixiuKCBPlugin - cmd 2000)
            if (Array.isArray(json) && json[1]?.htr && json[1]?.cmd === 2000) {
                const htr = json[1].htr;
                const latest = htr[htr.length - 1];

                if (latest && latest.sid && !processedSid.has(latest.sid) && latest.d1 !== undefined) {
                    const sid = latest.sid;
                    processedSid.add(sid);
                    currentSid = sid;

                    const { d1, d2, d3 } = latest;
                    const total = d1 + d2 + d3;
                    const shorthand = total > 10 ? "t" : "x";

                    history.push(shorthand);
                    if (history.length > 20) history.shift();

                    const pattern = history.join("").toLowerCase();
                    const timeStr = getCurrentTime();

                    currentData = {
                        "Phiên trước": sid,
                        "xúc xắc 1": d1,
                        "xúc xắc 2": d2,
                        "xúc xắc 3": d3,
                        "kết quả": total,
                        "pattern": pattern,
                        "phiên hiện tại": sid + 1,
                        "time": timeStr,
                        "id": "Dwong1410"
                    };

                    fullHistory.push(currentData);
                    if (fullHistory.length > 300) fullHistory.shift();

                    console.log(`[${getCurrentTime()}] 🎲 B52 MD5: Phiên ${sid} ➜ ${d1}-${d2}-${d3} = ${total}`);
                }
            }
        } catch (e) {
            console.error(`[${getCurrentTime()}] ❌ B52 MD5: Message error`, e.message);
        }
    });

    ws.on('close', () => {
        isConnected = false;
        isConnecting = false;
        if (pingInterval) clearInterval(pingInterval);
        const delay = Math.min(30000, 2000 * Math.pow(2, reconnectAttempts));
        reconnectTimeout = setTimeout(connectWebSocket, delay);
    });

    ws.on('error', (err) => {
        isConnecting = false;
    });
}

function setupKeepAlive() {
    if (pingInterval) clearInterval(pingInterval);
    pingInterval = setInterval(() => {
        if (!isConnected) return;
        safeSend(["7", "MiniGame", "1", Math.floor(Date.now() / 1000)]);
    }, 15000);
}

function startHealthCheck() {
    setInterval(() => {
        if (isConnected && Date.now() - lastActivityTime > 45000) {
            console.log(`[${getCurrentTime()}] 🚨 B52 MD5: No activity, reconnecting...`);
            if (ws) ws.terminate();
        }
    }, 10000);
}

module.exports = {
    getCurrentData: () => currentData || { status: "waiting", time: getCurrentTime() },
    getHistory: (limitStr) => {
        let limit = 300;
        if (limitStr) {
            const parsed = parseInt(limitStr);
            if (!isNaN(parsed) && parsed > 0) limit = Math.min(parsed, 300);
        }
        return fullHistory.slice(-limit);
    },
    startConnection: () => {
        connectWebSocket();
        startHealthCheck();
    }
};
