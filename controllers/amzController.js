const axios = require("axios");
const moment = require("moment");
const os = require("os");

const endpoint = "https://sellingpartnerapi-eu.amazon.com";
const marketplace_id = "ATVPDKIKX0DER";

const authenticate = async () => {
    try {
        const response = await axios.post("https://api.amazon.com/auth/o2/token", {
            "grant_type": "refresh_token",
            "refresh_token": process.env.REFRESH_TOKEN,
            "client_id": process.env.SELLING_PARTNER_APP_CLIENT_ID,
            "client_secret": process.env.SELLING_PARTNER_APP_CLIENT_SECRET
        });

        return response.data
    } catch (error) {
        console.error("Error fetching access token:", error.message);
    }
}

const auth = async (req, res) => {
    try {
        const response = await axios.post("https://api.amazon.com/auth/o2/token", {
            "grant_type": "refresh_token",
            "refresh_token": process.env.REFRESH_TOKEN,
            "client_id": process.env.SELLING_PARTNER_APP_CLIENT_ID,
            "client_secret": process.env.SELLING_PARTNER_APP_CLIENT_SECRET
        });

        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error fetching access token:", error.message);
        res.status(500).json({ error: "Failed to authenticate", error: error });
    }
};

const orders = async (req, res) => {
    try {
        const createdAfter = moment().subtract(30, 'days').toISOString();
        const req_params = {
            "MarketplaceIds": [marketplace_id],
            "createdAfter": "2020-10-10",
            "MaxResultPerPage": 2
        };

        const authTokens = await authenticate();

        const queryString = new URLSearchParams(req_params).toString();
        const url = `https://sellingpartnerapi-eu.amazon.com/orders/v0/orders?MarketplaceIds=A1PA6795UKMFR9&CreatedAfter=2020-10-10&MaxResultPerPage=2`;
        // https://sellingpartnerapi-eu.amazon.com/orders/v0/orders?MarketplaceIds=ATVPDKIKX0DER&CreatedAfter=2020-10-10&MaxResultPerPage=2
        const response = await axios.get(url, {
            "headers": {
                "x-amz-access-token": authTokens.access_token,
                "Content-Type": "application/json"
            }
        });

        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Error getting orders", error: error });
    }
};


const finances = async (req, res) => {
    try {
        const response = await axios.get(`${endpoint}/finances/v0/financialEventGroups`);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Error getting finances", error: error });
    }
}

const catalogueItems = async (req, res) => {
};

const getListingItems = async (req, res) => {

};

const productFees = async (req, res) => {

};

const productPricing = async (req, res) => {

};

const reports = async (req, res) => {

};

const sales = async (req, res) => {

};

const getShipments = async (req, res) => {

};


module.exports = {
    auth,
    catalogueItems,
    getListingItems,
    finances,
    orders,
    productFees,
    productPricing,
    reports,
    sales,
    getShipments,
}

// https://sellingpartnerapi-na.amazon.com