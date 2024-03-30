require("dotenv").config();
const axios = require("axios");

const getEtsyOrders = async (req, res) => {
  try {
    const url = `https://api.etsy.com/v3/application/openapi-ping`;
    const response = await axios.get(url, {
      headers: {
        'headers': {
          'x-api-key': 'sb265e056jr9f7qo2w8y0kng',
        },
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Error getting orders", error: error });
  }
};


module.exports = {
  getEtsyOrders,
};
