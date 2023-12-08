const jwt = require('jsonwebtoken');

function decode(params) {
    try {
        const [, jwtToken] = params.split(' ');
        return jwt.verify(jwtToken, process.env.JWT_SECRET);

    } catch (error) {
        return error.message
    }
}

module.exports = decode;