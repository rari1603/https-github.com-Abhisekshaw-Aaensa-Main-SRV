const jwt = require('jsonwebtoken');

const CreateToken = (user) => {
    const token = jwt.sign({ user: user }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY,
    });

    return token;
}

const hashValue = (email, expiresIn) => {
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: expiresIn ? expiresIn : '5m',
    });

    return token;
}


// module.exports = CreateToken;

module.exports = {
    CreateToken,
    hashValue
};