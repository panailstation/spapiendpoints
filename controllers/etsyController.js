require("dotenv").config();
const axios = require("axios");
const crypto = require("crypto");
const { generateCode } = require("../utils/etsy/code-generator");
const { response } = require("express");
const { listingDetails } = require("../utils/etsy/listingDetails");

const endpoint = "https://openapi.etsy.com/v3/";
const client_id = process.env.ETSY_KEY_STRING;
const redirect_uri = `https://manageorders-inventory.onrender.com/api/etsy/oauth/redirect`;
const shop_id = "192837465"

let cachedRedirect = null;
let authTokens = null;
let accessToken = null;
let refreshToken = null;

const getRedirect = async () => {
  if (!cachedRedirect) {
    try {
      cachedRedirect = await generateCode({ client_id, redirect_uri });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  return cachedRedirect;
};

// const getAuthorizationCode = async (code) => {
//   const queryParams = {
//     grant_type: "refresh_token",
//     client_id: "1aa2bb33c44d55eeeeee6fff",
//     refresh_token: code?.refresh_token
//   };

//   const queryString = new URLSearchParams(queryParams).toString();

//   try {
//     const response = await axios.post(
//       `https://api.etsy.com/v3/public/oauth/token?${queryString}`
//     );
//     console.log("Token refreshed:", response.data);
//     if (!refreshToken) {
//       refreshToken = response.data.refresh_token;
//     }
//     if (!authTokens) {
//       if (code) {
//         authTokens = code.access_token;
//       }
//     }
//     return { access_token: accessToken, refresh_token: refreshToken };
//   } catch (error) {
//     console.error("Error refreshing token:", error);
//   }
// };

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
  try {
    const redirect = await getRedirect();
    console.log("code1", redirect.codeChallenge);
    res.render("index", {
      uri: redirect?.url,
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating redirect", error });
  }
};

const oAuth = async (req, res) => {
  try {
    const redirect = await getRedirect();
    console.log("code2", redirect.codeChallenge);
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
          code_verifier: redirect?.codeChallenge,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      )
      .then(async (response) => {
        console.log(response.data);
        const tokenData = response.json();
        res.status(200).json(response.data)
        // res.redirect(`/welcome?access_token=${tokenData.access_token}`);
        // await getAuthorizationCode(tokenData);
        // return res.status(200).json(response.data);
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

const welcome = async (req, res) => {
  // We passed the access token in via the querystring
  const { access_token } = req.query;

  // An Etsy access token includes your shop/user ID
  // as a token prefix, so we can extract that too
  const user_id = access_token.split(".")[0];

  const requestOptions = {
    headers: {
      "x-api-key": client_id,
      // Scoped endpoints require a bearer token
      Authorization: `Bearer ${access_token}`,
    },
  };

  const response = await fetch(
    `https://api.etsy.com/v3/application/users/${user_id}`,
    requestOptions
  );

  if (response.ok) {
    const userData = await response.json();

    res.json(userData);
    // Load the template with the first name as a template variable.
    // res.render("welcome", {
    //   first_name: userData.first_name
    // });
  } else {
    res.send("oops");
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
};

const listPhysicalProduct = async (req, res) => {
  try {

    const url = `https://api.etsy.com/v3/application/shops/${shop_id}/listings`;
    await axios
      .post(url, listingDetails(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-api-key': client_id,
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error creating Listing",
          error: error.response.data,
        });
      });
  } catch (error) {
    res.status(500).json({ message: "Error creating Listing", error: error });
  }
};

const addImageToListing = async (req, res) => {
  try {
    const listing_id = "192837465"
    const url = `https://api.etsy.com/v3/application/shops/${shop_id}/listings/${listing_id}/images`;
    await axios
      .post(url, listingDetails(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-api-key': client_id,
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error creating Listing",
          error: error.response.data,
        });
      });
  } catch (error) {
    res.status(500).json({ message: "Error creating Listing", error: error });
  }
};

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
  listPhysicalProduct,
  addImageToListing,
  getListings,
};
