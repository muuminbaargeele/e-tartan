import axios from "axios";

let smsToken: string | null = null;
let tokenExpiry: number | null = null;

async function getHormuudSmsToken() {
    // If token is still valid, use it
    if (smsToken && tokenExpiry && Date.now() < tokenExpiry - 60_000) return smsToken;

    const payload = new URLSearchParams({
        grant_type: "password",
        username: process.env.HORMUUD_SMS_USERNAME!,
        password: process.env.HORMUUD_SMS_PASSWORD!,
    });

    const resp = await axios.post(
        process.env.HORMUUD_SMS_TOKEN_URL!,
        payload,
        { headers: { "content-type": "application/x-www-form-urlencoded" } }
    );

    smsToken = resp.data.access_token;
    // Hormuud does not specify expiry in docs, but if present: set tokenExpiry
    // tokenExpiry = Date.now() + (resp.data.expires_in || 3600) * 1000;

    return smsToken;
}

export async function sendSmsOtp(phone: string, code: string) {
    const token = await getHormuudSmsToken();

    const smsPayload = {
        refid: "0",
        mobile: phone, // Must be 61xxxxxxx format (Somalia local)
        message: `Your e-tartan OTP code is: ${code}`,
        senderid: process.env.HORMUUD_SMS_SENDERID || "e-tartan",
        validity: 5,
        // Add delivery param if needed
    };

    const resp = await axios.post(
        process.env.HORMUUD_SMS_SEND_URL!,
        smsPayload,
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            }
        }
    );

    if (resp.data.ResponseCode !== "200") {
        // Print the full Hormuud API response for debugging
        let extra = "";
        if (resp.data.Data && resp.data.Data.Description) {
            extra = ` (${resp.data.Data.Description})`;
        }
        throw new Error(`SMS not sent: ${resp.data.ResponseMessage}${extra}`);
    }
    return true;
}