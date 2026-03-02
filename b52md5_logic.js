const axios = require('axios');

// Configuration
const POLLING_INTERVAL = 5000;
const URL = 'https://jakpotgwab.geightdors.net/glms/v1/notify/taixiu?platform_id=b5&gid=vgmn_101';

// State
let latestData = null;
let fullHistory = [];
let patternHistory = [];

function getCurrentTime() {
    return new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
}

function getTaiXiuShorthand(sum) {
    return sum > 10 ? 't' : 'x';
}

async function fetchMD5() {
    try {
        const response = await axios.get(URL, { timeout: 4000 });
        const data = response.data;
        if (data.status === "OK" && Array.isArray(data.data) && data.data.length > 0) {
            const game = data.data[0];
            const { sid, d1, d2, d3 } = game;

            if (sid && d1 !== undefined && d2 !== undefined && d3 !== undefined) {
                if (!latestData || latestData["Phiên trước"] !== sid) {
                    const total = d1 + d2 + d3;
                    const shorthand = getTaiXiuShorthand(total);

                    patternHistory.push(shorthand);
                    if (patternHistory.length > 20) patternHistory.shift();
                    const pattern = patternHistory.join('');

                    latestData = {
                        "id": "Dwong1410",
                        "Phiên trước": sid,
                        "xúc xắc 1": d1,
                        "xúc xắc 2": d2,
                        "xúc xắc 3": d3,
                        "kết quả": total,
                        "pattern": pattern,
                        "phiên hiện tại": sid + 1,
                        "time": getCurrentTime()
                    };

                    fullHistory.push(latestData);
                    if (fullHistory.length > 300) fullHistory.shift();
                    console.log(`[🎲 MD5] Phiên ${sid} ➜ ${d1}-${d2}-${d3} = ${total} (GET API)`);
                }
            }
        }
    } catch (e) {
        console.error(`[❌ MD5] Polling Error: ${e.message}`);
    }
}

module.exports = {
    getCurrentData: () => latestData || { status: "waiting", time: getCurrentTime() },
    getHistory: (limitStr) => {
        let limit = 300;
        if (limitStr) {
            const parsed = parseInt(limitStr);
            if (!isNaN(parsed) && parsed > 0) limit = Math.min(parsed, 300);
        }
        return fullHistory.slice(-limit);
    },
    startConnection: () => {
        fetchMD5();
        setInterval(fetchMD5, POLLING_INTERVAL);
    }
};
