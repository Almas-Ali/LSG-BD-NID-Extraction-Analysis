// Copyright (c) 2025 Md. Almas Ali
// If you are using this code, please give proper credit to the author.
// This code is provided "as is" without warranty of any kind.
// Use at your own risk.

const CryptoJS = require("crypto-js");

const SECRET_KEY_STRING = "lsg56xy14yu45dfgy124dfe12dr52fgd"; // 32 chars = AES-256
const SECRET_KEY = CryptoJS.enc.Utf8.parse(SECRET_KEY_STRING);

function encryptData(data) {
    // ALWAYS generate a new IV per encryption
    const iv = CryptoJS.lib.WordArray.random(16);

    const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        SECRET_KEY,
        {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }
    );

    return JSON.stringify({
        iv: CryptoJS.enc.Base64.stringify(iv),
        encryptedData: encrypted.toString() // Base64
    });
}

function decryptData(tokenized_en_data) {
    const parsed = JSON.parse(tokenized_en_data);

    const iv = CryptoJS.enc.Base64.parse(parsed.iv);

    const decrypted = CryptoJS.AES.decrypt(
        parsed.encryptedData,
        SECRET_KEY,
        {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        }
    );

    return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
}

// NID data extraction
const userData = {
    nid: "1234567890123", // Your NID Number here
    dob: "1999-01-01"    // Your Date of Birth here in YYYY-MM-DD format
};
const tokenized_en_data = JSON.parse(encryptData(userData));

// Function to extract CSRF token and cookies from Laravel page
async function getCsrfTokenAndCookies() {
    const response = await fetch("https://lsg-land-owner.land.gov.bd/", {
        credentials: "include"
    });
    const html = await response.text();

    // Extract CSRF token from meta tag
    const match = html.match(/<meta name="csrf-token" content="([^"]+)"/);
    const csrfToken = match ? match[1] : null;

    // Extract cookies from response headers using getSetCookie() for native fetch
    const setCookieHeaders = response.headers.getSetCookie ?
        response.headers.getSetCookie() :
        response.headers.get('set-cookie')?.split(', ') || [];

    // Parse cookies to extract only the name=value pairs
    const cookies = Array.isArray(setCookieHeaders)
        ? setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ')
        : setCookieHeaders.split(';')[0];

    return { csrfToken, cookies };
}

// Main execution
(async () => {
    // Get fresh CSRF token and session cookies
    const { csrfToken, cookies } = await getCsrfTokenAndCookies();
    console.log("CSRF Token:", csrfToken);
    console.log("Cookies:", cookies);

    // URL-encode the payload exactly like browser does
    const body = new URLSearchParams({
        tokenized_en_data: JSON.stringify(tokenized_en_data)
    }).toString();

    fetch("https://lsg-land-owner.land.gov.bd/check/user/nid/verification", {
        method: "POST",
        headers: {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "x-csrf-token": csrfToken,
            "x-requested-with": "XMLHttpRequest",
            "cookie": cookies
        },
        body: body,
        credentials: "include"
    })
        .then(res => res.text())
        .then(data => {
            console.log("Raw response:", data);
            try {
                console.log("Parsed JSON:", JSON.parse(data));
            } catch {
                console.log("Non-JSON response");
            }
        })
        .catch(err => console.error(err));
})();
