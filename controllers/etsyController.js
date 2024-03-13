const getEtsyOrders = async (req, res) => {
  try {
    const response = await axios.get('https://openapi.etsy.com/v3/application/shops/{shop_id}/receipts', {
      headers: {
        'x-api-key': 'YOUR_ETSY_API_KEY',
        'Authorization': `Bearer ${"YOUR_OAUTH_TOKEN"}`
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).send('Error retrieving orders from Etsy');
  }
}

module.exports = {
  getEtsyOrders
}