const axios = require("axios");
const fs = require("fs");
const moment = require("moment");

const marketplace_id = "A1PA6795UKMFR9";
const endpoint = "https://sellingpartnerapi-eu.amazon.com";
const sellerId = "A12ZW5F2C6LX3M";
const sku = "T5-TUY3-3FH8";

const exampleFeedDocument = {
  header: {
    sellerId: "AXXXXXXXXXXXX", // Please add a correct seller Id here
    version: "2.0",
    issueLocale: "en_US",
  },
  messages: [
    {
      messageId: 1,
      sku: "My-SKU-A",
      operationType: "DELETE",
    },
    {
      messageId: 2,
      sku: "My-SKU-B",
      operationType: "PARTIAL_UPDATE",
      productType: "LUGGAGE",
      attributes: {
        fulfillment_availability: [
          {
            fulfillment_channel_code: "DEFAULT",
            quantity: 10,
          },
        ],
      },
    },
    {
      messageId: 3,
      sku: "My-SKU-C",
      operationType: "UPDATE",
      productType: "LUGGAGE",
      requirements: "LISTING_OFFER_ONLY",
      attributes: {
        condition_type: [
          {
            value: "new_new",
            marketplace_id: "ATVPDKIKX0DER",
          },
        ],
        merchant_suggested_asin: [
          {
            value: "AXXXXXXXXXXXX",
            marketplace_id: "A1PA6795UKMFR9",
          },
        ],
        fulfillment_availability: [
          {
            fulfillment_channel_code: "DEFAULT",
            quantity: 0,
          },
        ],
        purchasable_offer: [
          {
            currency: "USD",
            our_price: [
              {
                schedule: [
                  {
                    value_with_tax: 100,
                  },
                ],
              },
            ],
            marketplace_id: "A1PA6795UKMFR9",
          },
        ],
      },
    },
    {
      messageId: 4,
      sku: "My-SKU-D",
      operationType: "PATCH",
      productType: "LUGGAGE",
      patches: [
        {
          op: "replace",
          path: "/attributes/fulfillment_availability",
          value: [
            {
              fulfillment_channel_code: "DEFAULT",
              quantity: 10,
            },
          ],
        },
      ],
    },
  ],
};

const authenticate = async () => {
  try {
    const response = await axios.post("https://api.amazon.com/auth/o2/token", {
      grant_type: "refresh_token",
      refresh_token: process.env.REFRESH_TOKEN,
      client_id: process.env.SELLING_PARTNER_APP_CLIENT_ID,
      client_secret: process.env.SELLING_PARTNER_APP_CLIENT_SECRET,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching access token:", error.message);
  }
};

const createFeedDocument = async () => {
  try {
    const authTokens = await authenticate();
    const response = await axios.post(
      `${endpoint}/feeds/2021-06-30/documents`,
      {
        contentType: "text/xml; charset=UTF-8",
      },
      {
        headers: {
          "x-amz-access-token": authTokens.access_token,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Could not create Feed Document:", error.message);
  }
};

const uploadFeed = async (feedUrl) => {
  const contentType = "application/json; charset=utf-8";

  const instance = axios.create({
    headers: {
      "Content-Type": contentType,
    },
  });

  instance
    .post(feedUrl, exampleFeedDocument)
    .then((response) => {
      console.log("Upload successful:", response.data);
      return response.data;
    })
    .catch((error) => {
      console.error("Upload failed:", error.response.data);
    });
};

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
        {
          clientReferenceId: "911-7267646-6348616",
          shipFrom: {
            name: "test name 1",
            addressLine1: "some Test address 1",
            postalCode: "90013",
            city: "Los Angeles",
            countryCode: "US",
            stateOrRegion: "CA",
            email: "testEmail1@amazon.com",
            phoneNumber: "1234567890",
          },
          shipTo: {
            name: "test name 2",
            addressLine1: "some Test address 2",
            postalCode: "90013-1805",
            city: "LOS ANGELES",
            countryCode: "US",
            stateOrRegion: "CA",
            email: "testEmail2@amazon.com",
            phoneNumber: "1234567890",
          },
          containers: [
            {
              containerType: "PACKAGE",
              containerReferenceId: "ContainerRefId-01",
              items: [
                {
                  title: "String",
                  quantity: 2,
                  unitPrice: {
                    unit: "USD",
                    value: 14.99,
                  },
                  unitWeight: {
                    unit: "lb",
                    value: 0.08164656,
                  },
                },
              ],
              dimensions: {
                height: 12,
                length: 36,
                width: 15,
                unit: "CM",
              },
              weight: {
                unit: "lb",
                value: 0.08164656,
              },
              value: {
                unit: "USD",
                value: 29.98,
              },
            },
          ],
        },
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
          message: "Error cancelling shipment",
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
          message: "Error cancelling shipment",
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

const getFeeds = async (req, res) => {
  try {
    const authTokens = await authenticate();

    const url = `${endpoint}/feeds/2021-06-30/feeds?feedTypes=POST_PRODUCT_DATA`;
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
          message: "Error cancelling shipment",
          error: error.response.data,
        });
      });
  } catch (error) {
    res.status(500).json({ message: "Error getting orders", error: error });
  }
};

const createFeed = async (req, res) => {
  try {
    const feedDocument = await createFeedDocument();
    const authTokens = await authenticate();

    await uploadFeed(feedDocument.url);

    axios
      .post(
        `${endpoint}/feeds/2021-06-30/feeds`,
        {
          feedType: "POST_PRODUCT_DATA",
          marketplaceIds: ["ATVPDKIKX0DER", "A1PA6795UKMFR9"],
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

    const url = `${endpoint}/listings/2021-08-01/items/${sellerId}/${sku}?marketplaceIds=${marketplace_id}&issueLocale=en_US&includedData=issues,attributes,summaries,offers,fulfillmentAvailability`;
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

    const url = `${endpoint}/listings/2021-08-01/items/${sellerId}/ABC123?marketplaceIds=${marketplace_id}&issueLocale=en_US`;
    await axios
      .put(
        url,
        {
          productType: "LUGGAGE",
          requirements: "LISTING",
          attributes: {
            condition_type: [
              {
                value: "new_new",
                marketplace_id: marketplace_id,
              },
            ],
            item_name: [
              {
                value: 'AmazonBasics 16" Underseat Spinner Carry-On',
                language_tag: "en_US",
                marketplace_id: marketplace_id,
              },
            ],
          },
        },
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

    const url = `${endpoint}/listings/2021-08-01/items/${sellerId}/${sku}?marketplaceIds=${marketplace_id}&issueLocale=en_US`;
    await axios
      .patch(
        url,
        {
          productType: "LUGGAGE",
          patches: [
            {
              op: "replace",
              path: "/attributes/item_name",
              value: [
                {
                  value: 'AmazonBasics 16" Underseat Spinner Carry-On',
                  language_tag: "en_US",
                  marketplace_id: marketplace_id,
                },
              ],
            },
            {
              op: "replace",
              path: "/attributes/purchasable_offer",
              value: [
                {
                  marketplace_id: marketplace_id,
                  currency: "USD",
                  our_price: [
                    {
                      schedule: [
                        {
                          value_with_tax: 15.0,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              op: "delete",
              path: "/attributes/item_type_name",
              value: [
                {
                  marketplace_id: marketplace_id,
                  language_tag: "en_US",
                },
              ],
            },
          ],
        },
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

    const url = `${endpoint}/listings/2021-08-01/items/${sellerId}/${sku}?marketplaceIds=${marketplace_id}&issueLocale=en_US`;
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


