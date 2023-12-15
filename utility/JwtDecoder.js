const jwt = require('jsonwebtoken');

function decode(params) {
    const [, jwtToken] = params.split(' ');
    // console.log("jwtToken", jwt.verify(jwtToken, process.env.JWT_SECRET));
    return jwt.verify(jwtToken, process.env.JWT_SECRET);

}

function ExtractToken(token) {
    // Decode the token
    const decoded = jwt.decode(token);
    return decoded;
}

module.exports = { decode, ExtractToken };