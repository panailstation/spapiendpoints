const axios = require("axios");
const { authenticate } = require("../../utils/amz/auth");

const convertFnskuToAsin = async (req, res) => {
    try {
      const authTokens = await authenticate();
      const fnsku = req.query.fnsku; // FNSKU passed as a query parameter
      const endpoint = "https://sellingpartnerapi-eu.amazon.com";
      const marketplace_id = "A1PA6795UKMFR9";
  
      if (!fnsku) {
        return res.status(400).json({ message: "FNSKU is required" });
      }
  
      const url = `${endpoint}/catalog/2022-04-01/items?identifiers=${fnsku}&identifierType=SKU&marketplaceIds=${marketplace_id}`;
  
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          "x-amz-access-token": authTokens.access_token,
        },
      });
  
      const items = response.data.items;
  
      if (!items || items.length === 0) {
        return res.status(404).json({ message: "No ASIN found for this FNSKU" });
      }
  
      // Extract ASIN and relevant details
      const asin = items[0].asin;
      const title = items[0].attributes?.title?.[0] || "No title found";
  
      res.status(200).json({
        message: "ASIN retrieved successfully",
        fnsku: fnsku,
        asin: asin,
        title: title,
        details: items[0],
      });
  
    } catch (error) {
      console.error("Error retrieving ASIN from FNSKU:", error.message);
      res.status(500).json({
        message: "Error retrieving ASIN",
        error: error.response ? error.response.data : error.message,
      });
    }
  };

module.exports = { convertFnskuToAsin };
