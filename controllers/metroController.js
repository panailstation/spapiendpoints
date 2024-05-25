const axios = require('axios');
const { signRequest } = require("../utils/metro/signRequest");



const url = "https://service-category.sandbox.infra.metro-markets.cloud/public/api/v1/DE/categories";
const method = "GET";
const clientKey = ""; // Your client key here
const clientSecret = ""; // Your client secret here
const unixTime = Math.floor(Date.now() / 1000);
const signature = signRequest(method, url, "", unixTime, clientSecret);


const authenticate = async (req, res) => {
    try {
        const response = await axios.get(url, {
            headers: {
                'X-Client-Id': clientKey,
                'X-Timestamp': unixTime,
                'X-Signature': signature,
                'Accept': 'application/json'
            }
        });

        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Error getting users", error: error });
    }
}


module.exports = {
    authenticate
}