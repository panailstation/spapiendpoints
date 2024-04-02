const crypto = require("crypto");


const generateCode = async ({client_id, redirect_uri}) => {
    try {
        const base64URLEncode = (str) =>
            str
                .toString("base64")
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=/g, "");

        const sha256 = (buffer) => crypto.createHash("sha256").update(buffer).digest();

        const codeVerifier = await base64URLEncode(crypto.randomBytes(32));

        const codeChallenge = await base64URLEncode(sha256(codeVerifier));
        const state = Math.random().toString(36).substring(7);

        console.log("redirect Uri", redirect_uri);

        return `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=${redirect_uri}&scope=email_r&client_id=${client_id}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`

    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    generateCode,
}