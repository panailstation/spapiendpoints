const axios = require("axios");
const fs = require("fs");
const moment = require("moment");
const { authenticate } = require("../utils/amz/auth");
const { createFeedDocument, uploadFeed } = require("../utils/amz/feeds");
const { shipmentData } = require("../utils/amz/shipmentData");
const { listingData, patchListingData } = require("../utils/amz/listingData");

const marketplace_id = "A1PA6795UKMFR9"; // This is used for the case of a single id
const marketplaceIds = ["ATVPDKIKX0DER", "A1PA6795UKMFR9"] // This is used for the case of many ids. You can add as much as possible. 
const endpoint = "https://sellingpartnerapi-eu.amazon.com";
const sku = "T5-TUY3-3FH8";


const auth = async (req, res) => {
  try {
    const response = await axios.post("https://api.amazon.com/auth/o2/token", {
      grant_type: "refresh_token",
      refresh_token: process.env.REFRESH_TOKEN,
      client_id: process.env.SELLING_PARTNER_APP_CLIENT_ID,
      client_secret: process.env.SELLING_PARTNER_APP_CLIENT_SECRET,
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching access token:", error.message);
    res.status(500).json({ error: "Failed to authenticate", error: error });
  }
};

const getOrders = async (req, res) => {
  try {
    const createdAfter = moment().subtract(30, "days").toISOString();

    const authTokens = await authenticate();

    const url = `${endpoint}/orders/v0/orders?MarketplaceIds=${marketplace_id}&CreatedAfter=${createdAfter}&MaxResultPerPage=2`;
    const response = await axios.get(url, {
      headers: {
        "x-amz-access-token": authTokens.access_token,
        "Content-Type": "application/json",
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Error getting orders", error: error });
  }
};

const getOrder = async (req, res) => {
  try {
    const authTokens = await authenticate();

    const orderId = req.query.id;

    const url = `${endpoint}/orders/v0/orders/${orderId}/`;
    const response = await axios.get(url, {
      headers: {
        "x-amz-access-token": authTokens.access_token,
        "Content-Type": "application/json",
      },
    });

    res.status(200).json(response.data);
  } catch (error) {
    res.status(500).json({ message: "Error getting order", error: error });
  }
};

const createShipment = async (req, res) => {
  try {
    const authTokens = await authenticate();

    const url = `${endpoint}/shipping/v1/shipments`;
    await axios
      .post(
        url,
        shipmentData(), // This data is contained in shipmentData function in the amz utils
        {
          headers: {
            "Content-Type": "application/json",
            "x-amz-access-token": authTokens.access_token,
          },
        }
      )
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error creating shipment",
          error: error.response.data,
        });
      });
  } catch (error) {
    res.status(500).json({ message: "Error creating Shipment", error: error });
  }
};

const getShipment = async (req, res) => {
  const shipmentId = req.query.id;

  try {
    const authTokens = await authenticate();

    await axios
      .get(`${endpoint}/shipping/v1/shipments/${shipmentId}`, {
        headers: {
          "x-amz-access-token": authTokens.access_token,
        },
      })
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error getting shipment",
          error: error.response.data,
        });
      });
  } catch (error) {
    console.error("Error getting shipment:", error.message);
    res.status(500).json({ message: "Error getting shipment", error: error });
  }
};

const cancelShipment = async (req, res) => {
  const shipmentId = req.query.id;
  try {
    const authTokens = await authenticate();

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-amz-access-token": authTokens.access_token,
    };

    await axios
      .post(
        `${endpoint}/shipping/v1/shipments/${shipmentId}/cancel`,
        {},
        { headers: headers }
      )
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error cancelling shipment",
          error: error.response.data,
        });
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error cancelling shipment", error: error });
  }
};

const purchaseLabel = async (req, res) => {
  const shipmentId = req.query.id;

  try {
    const authTokens = await authenticate();

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-amz-access-token": authTokens.access_token,
    };

    await axios
      .post(
        `${endpoint}/shipping/v1/shipments/${shipmentId}/purchaseLabels`,
        {
          rateId: "rate identifier",
          labelSpecification: {
            labelFormat: "PNG",
            labelStockSize: "4x6",
          },
        },
        { headers: headers }
      )
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error purchasing label",
          error: error.response.data,
        });
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error purchasing label", error: error });
  }
};

const getFeeds = async (req, res) => {
  try {
    const authTokens = await authenticate();

    const url = `${endpoint}/feeds/2021-06-30/feeds?feedTypes=POST_PRODUCT_DATA`; // e.g for POST_PRODUCT_DATA
    await axios
      .get(url, {
        headers: {
          "Content-Type": "application/json",
          "x-amz-access-token": authTokens.access_token,
        },
      })
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error getting feeds",
          error: error.response.data,
        });
      });
  } catch (error) {
    res.status(500).json({ message: "Error getting feeds", error: error });
  }
};

const createFeed = async (req, res) => {
  try {
    const feedDocument = await createFeedDocument();
    const authTokens = await authenticate();

    // console.log('created document', feedDocument);

    await uploadFeed(feedDocument.url);

    axios
      .post(
        `${endpoint}/feeds/2021-06-30/feeds`,
        {
          feedType: "POST_PRODUCT_DATA",
          marketplaceIds: marketplaceIds,
          inputFeedDocumentId: feedDocument.feedDocumentId,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-amz-access-token": authTokens.access_token,
          },
        }
      )
      .then((response) => {
        axios
          .get(`${endpoint}/feeds/2021-06-30/feeds/${response.data.feedId}`, {
            headers: {
              "Content-Type": "application/json",
              "x-amz-access-token": authTokens.access_token,
            },
          })
          .then((result) => {
            res.json({
              result,
            });
          })
          .catch((err) => {
            res.status(500).json({ error: err });
          });
      })
      .catch((error) => {
        res.status(500).json({ error: error.response.data });
      });
  } catch (error) {
    res.status(500).json({ message: "Error creating Feeds", error: error });
  }
};

const getListingItems = async (req, res) => {
  try {
    const authTokens = await authenticate();

    const url = `${endpoint}/listings/2021-08-01/items/${process.env.AMZ_SELLER_ID}/${sku}?marketplaceIds=${marketplace_id}&issueLocale=en_US&includedData=issues,attributes,summaries,offers,fulfillmentAvailability`;
    await axios
      .get(url, {
        headers: {
          "Content-Type": "application/json",
          "x-amz-access-token": authTokens.access_token,
        },
      })
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error getting Listings Items",
          error: error.response.data,
        });
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error getting Listings Items", error: error });
  }
};

const putListing = async (req, res) => {
  try {
    const authTokens = await authenticate();
    
    // TODO: Confirm url for put listing. DONE.
    const url = `${endpoint}/listings/2021-08-01/items/${process.env.AMZ_SELLER_ID}/${sku}?marketplaceIds=${marketplace_id}&issueLocale=en_US`;
    await axios
      .put(
        url,
        listingData(marketplace_id),
        {
          headers: {
            "Content-Type": "application/json",
            "x-amz-access-token": authTokens.access_token,
          },
        }
      )
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error Putting Listing",
          error: error.response.data,
        });
      });
  } catch (error) {
    res.status(500).json({ message: "Error Putting Listing", error: error });
  }
};

const patchListing = async (req, res) => {
  try {
    const authTokens = await authenticate();

    const url = `${endpoint}/listings/2021-08-01/items/${process.env.AMZ_SELLER_ID}/${sku}?marketplaceIds=${marketplace_id}&issueLocale=en_US`;
    await axios
      .patch(
        url,
        patchListingData(marketplace_id),
        {
          headers: {
            "Content-Type": "application/json",
            "x-amz-access-token": authTokens.access_token,
          },
        }
      )
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error patching Listing",
          error: error.response.data,
        });
      });
  } catch (error) {
    res.status(500).json({ message: "Error patching Listing", error: error });
  }
};

const deleteListing = async (req, res) => {
  try {
    const authTokens = await authenticate();

    const url = `${endpoint}/listings/2021-08-01/items/${process.env.AMZ_SELLER_ID}/${sku}?marketplaceIds=${marketplace_id}&issueLocale=en_US`;
    await axios
      .delete(
        url,
        {
          headers: {
            "Content-Type": "application/json",
            "x-amz-access-token": authTokens.access_token,
          },
        }
      )
      .then((response) => {
        return res.status(200).json(response.data);
      })
      .catch((error) => {
        res.status(500).json({
          message: "Error Deleting Listing",
          error: error.response.data,
        });
      });
  } catch (error) {
    res.status(500).json({ message: "Error Deleting Listing", error: error });
  }
};

module.exports = {
  auth,
  getOrders,
  getOrder,
  createShipment,
  getShipment,
  cancelShipment,
  purchaseLabel,
  getFeeds,
  createFeed,
  getListingItems,
  putListing,
  patchListing,
  deleteListing,
};


