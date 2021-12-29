const crypto = require('crypto');

module.exports = (string) => crypto.createHash('sha256').update(string).digest('hex');
