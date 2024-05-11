const authenticate = async (req, res) => {
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


module.exports = {
    authenticate
}