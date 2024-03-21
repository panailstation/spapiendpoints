require("dotenv").config();
const axios = require("axios");
// const fetch = require("node-fetch");

const getEtsyOrders = async (req, res) => {
  console.log("getting etsy orders", process.env.ETSY_KEY_STRING);
  try {
    const requestOptions = {
      'method': 'GET',
      'headers': {
        'x-api-key': '1aa2bb33c44d55eeeeee6fff',
      },
    };

    const response = await fetch(
      'https://api.etsy.com/v3/application/openapi-ping',
      requestOptions
    );

    console.log("response: ", response);

    if (response.ok) {
      const data = await response.json();
      res.send(data);
    } else {
      res.send("oops");
    }
  } catch (error) {
    res.status(500).json({
      error: {
        message: "Error retrieving orders from Etsy",
        error: error
      }
    });
  }
};


module.exports = {
  getEtsyOrders,
};
