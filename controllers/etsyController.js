require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");
const { generateCode } = require("../utils/etsy/code-generator");
const { response } = require("express");

const base64URLEncode = (str) =>
  str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

const endpoint = "https://openapi.etsy.com/v3/";
const client_id = process.env.ETSY_KEY_STRING;
const clientVerifier = base64URLEncode(crypto.randomBytes(32));
const redirect_uri = `https://manageorders-inventory.onrender.com/api/etsy/oauth/redirect`;


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
  const redirect = await generateCode({ client_id, redirect_uri });
  res.render("index", {
    uri: redirect
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
          code_verifier: clientVerifier,
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
