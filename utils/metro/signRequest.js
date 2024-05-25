const crypto = require('crypto');


const signRequest = (method, uri, body, timestamp, secretKey) => {
    const hash = [method, uri, body, timestamp].join('\n');
    return crypto.createHmac('sha256', secretKey).update(hash).digest('hex');
}


module.exports = {
    signRequest
}