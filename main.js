// Copyright (c) 2025 Md. Almas Ali
// If you are using this code, please give proper credit to the author.
// This code is provided "as is" without warranty of any kind.
// Use at your own risk.

// Copyright (c) 2025 Md. Almas Ali
// Provided "as is" without warranty. Use at your own risk.

const CryptoJS = require("crypto-js");

const SECRET_KEY = CryptoJS.enc.Utf8.parse("lsg56xy14yu45dfgy124dfe12dr52fgd");

const encrypt = (data) => {
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return JSON.stringify({
    iv: CryptoJS.enc.Base64.stringify(iv),
    encryptedData: encrypted.toString(),
  });
};

const decrypt = (token) => {
  const { iv, encryptedData } = JSON.parse(token);
  const decrypted = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY, {
    iv: CryptoJS.enc.Base64.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
};

const getCsrf = async () => {
  const res = await fetch("https://lsg-land-owner.land.gov.bd/", {
    credentials: "include",
  });
  const html = await res.text();
  const csrfToken = html.match(
    /<meta name="csrf-token" content="([^"]+)"/,
  )?.[1];
  const cookies = (res.headers.getSetCookie?.() || [])
    .map((c) => c.split(";")[0])
    .join("; ");
  return { csrfToken, cookies };
};

(async () => {
  const { csrfToken, cookies } = await getCsrf();

  const payload = encrypt({ nid: "1234567890123", dob: "1999-01-01" });

  const res = await fetch(
    "https://lsg-land-owner.land.gov.bd/check/user/nid/verification",
    {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "x-csrf-token": csrfToken,
        "x-requested-with": "XMLHttpRequest",
        cookie: cookies,
      },
      body: new URLSearchParams({ tokenized_en_data: payload }),
      credentials: "include",
    },
  );

  const data = await res.text();
  console.log(data);
  try {
    console.log(JSON.parse(data));
  } catch {}
})();
