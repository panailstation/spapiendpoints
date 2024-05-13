require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");
const { generateCode } = require("../utils/etsy/code-generator");
const { response } = require("express");

const endpoint = "https://openapi.etsy.com/v3/";
const client_id = process.env.ETSY_KEY_STRING;
const redirect_uri = `https://manageorders-inventory.onrender.com/api/etsy/oauth/redirect`;
const redirect = generateCode({ client_id, redirect_uri });


const ping = async (req, res) => {
  try {
    const url = `https://api.etsy.com/v3/application/openapi-ping`;
    const response = await axios.get(url, {
      headers: {
        "x-api-key": process.env.ETSY_KEY_STRING,
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Error getting orders", error: error });
  }
};

const authenticate = async (req, res) => {
  res.render("index", {
    uri: redirect.url
  });
};

const oAuth = async (req, res) => {
  try {
    const authCode = req.query.code;

    const url = `https://api.etsy.com/v3/public/oauth/token`;
    await axios
      .post(
        url,
        {
          grant_type: "authorization_code",
          client_id: client_id,
          redirect_uri: redirect_uri,
          code: authCode,
          code_verifier: redirect.codeChallenge,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        console.log(response.data);
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error posting to oAuth",
          error: error.response.data,
        });
      });
  } catch (error) {
    res.status(500).json({ message: "Error posting to oAuth", error: error });
  }
}; 

const getUsers = async (req, res) => {
  try {
    const url = `${endpoint}/application/provisional-users`;
    const response = await axios.get(url, {
      headers: {
        "x-api-key": process.env.ETSY_KEY_STRING,
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Error getting users", error: error });
  }
}

const getListings = async (req, res) => {
  try {
    const url = `https://openapi.etsy.com/v2/listings/active?api_key=${process.env.ETSY_KEY_STRING}`;
    const response = await axios.get(url, {
      headers: {
        "x-api-key": process.env.ETSY_KEY_STRING,
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Error getting orders", error: error });
  }
};

module.exports = {
  ping,
  authenticate,
  oAuth,
  getUsers,
  getListings,
};
