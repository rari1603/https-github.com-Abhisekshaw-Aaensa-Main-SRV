const jwtDecode = require('../utility/JwtDecoder');

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    const [, jwtToken] = token.split(' ');
    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }

    try {
        const decoded = jwtDecode(jwtToken);
        req.user = decoded;
        next();
    } catch (error) {
        console.log(error.message);
        res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = verifyToken;