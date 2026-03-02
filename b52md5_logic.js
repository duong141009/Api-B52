const axios = require("axios");

function getCurrentTime() {
    return new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
}

// History tracking
let history = [];
let fullHistory = [];

let latestResult = {
    "Phiên trước": 0,
    "xúc xắc 1": 0,
    "xúc xắc 2": 0,
    "xúc xắc 3": 0,
    "kết quả": 0,
    "pattern": "",
    "phiên hiện tại": 0,
    "time": getCurrentTime(),
    "id": "Dwong1410"
};

function getTaiXiu(sum) {
    return sum > 10 ? "t" : "x";
}

function updateResult(d1, d2, d3, sid = null) {
    const total = d1 + d2 + d3;
    const shorthand = getTaiXiu(total);

    if (sid !== latestResult["Phiên trước"]) {
        history.push(shorthand);
        if (history.length > 20) history.shift();

        const pattern = history.join("").toLowerCase();
        const timeStr = getCurrentTime();

        latestResult = {
            "Phiên trước": sid || latestResult["Phiên trước"] || 0,
            "xúc xắc 1": d1,
            "xúc xắc 2": d2,
            "xúc xắc 3": d3,
            "kết quả": total,
            "pattern": pattern,
            "phiên hiện tại": (sid || latestResult["Phiên trước"] || 0) + 1,
            "time": timeStr,
            "id": "Dwong1410"
        };

        fullHistory.push(latestResult);
        if (fullHistory.length > 300) fullHistory.shift();

        console.log(`[${getCurrentTime()}] 🎲 B52 MD5: Phiên ${latestResult["Phiên trước"]} ➜ ${d1}-${d2}-${d3} = ${total}`);
    }
}

const API_TARGET_URL = 'https://jakpotgwab.geightdors.net/glms/v1/notify/taixiu?platform_id=b5&gid=vgmn_101';

async function fetchGameData() {
    try {
        const response = await axios.get(API_TARGET_URL);
        const data = response.data;

        if (data.status === "OK" && Array.isArray(data.data) && data.data.length > 0) {
            const game = data.data[0];
            const sid = game.sid;
            const d1 = game.d1;
            const d2 = game.d2;
            const d3 = game.d3;

            if (sid !== latestResult["Phiên trước"] && d1 !== undefined && d2 !== undefined && d3 !== undefined) {
                updateResult(d1, d2, d3, sid);
            }
        }
    } catch (error) {
        // console.error("❌ B52 MD5: API error", error.message);
    }
}

module.exports = {
    getCurrentData: () => latestResult,
    getHistory: (limitStr) => {
        let limit = 300;
        if (limitStr) {
            const parsed = parseInt(limitStr);
            if (!isNaN(parsed) && parsed > 0) limit = Math.min(parsed, 300);
        }
        return fullHistory.slice(-limit);
    },
    startConnection: () => {
        console.log(`[${getCurrentTime()}] 🚀 B52 MD5: Đã khởi tạo`);
        setInterval(fetchGameData, 5000);
        fetchGameData();
    }
};
