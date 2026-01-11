// File: test_ai.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

console.log("👉 BƯỚC 1: File test đã bắt đầu chạy...");

async function runTest() {
    // ---------------------------------------------------------
    // DÁN KEY THẬT CỦA BẠN VÀO GIỮA 2 DẤU NGOẶC KÉP DƯỚI ĐÂY:
    const apiKey = "AIzaSyCOW5xE83jhhy6Wkwen3jL-bubTyxyY2mc";
    // ---------------------------------------------------------

    if (!apiKey || apiKey.includes("Dán_Key")) {
        console.error("❌ LỖI: Bạn chưa dán API Key vào file test_ai.js!");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    console.log("👉 BƯỚC 2: Đang thử kết nối với model gemini-1.5-flash...");

    try {
        // Thử model mới nhất
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Hello Gemini, answer only 'OK' if you see this.");
        const response = await result.response;
        const text = response.text();

        console.log("✅ THÀNH CÔNG! Model 1.5-flash hoạt động tốt.");
        console.log("💬 Phản hồi từ AI:", text);

    } catch (error) {
        console.error("\n❌ THẤT BẠI VỚI 1.5-FLASH:");
        console.error("Chi tiết lỗi:", error.message);

        // Nếu 1.5-flash lỗi, thử model cũ
        console.log("\n👉 BƯỚC 3: Đang thử fallback về gemini-pro...");
        try {
            const modelOld = genAI.getGenerativeModel({ model: "gemini-pro" });
            const resultOld = await modelOld.generateContent("Hello");
            console.log("✅ THÀNH CÔNG! Model gemini-pro hoạt động.");
            console.log("=> Lời khuyên: Hãy đổi code trong project về 'gemini-pro'");
        } catch (errOld) {
            console.error("❌ CẢ 2 MODEL ĐỀU KHÔNG CHẠY ĐƯỢC.");
            console.error("=> Nguyên nhân: API KEY của bạn có vấn đề hoặc chưa kích hoạt.");
        }
    }
}

runTest();