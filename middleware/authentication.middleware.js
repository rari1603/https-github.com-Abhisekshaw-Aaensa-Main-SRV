const jwtDecode = require('../utility/JwtDecoder');

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    try {
        const decoded = jwtDecode.decode(token);
        req.user = decoded;
        next();
    } catch (error) {
        console.log("verifyToken=>catch=====>", error.message);
        return res.status(403).json({ success: false, message: 'Invalid token', err: error.message });
    }
};

module.exports = verifyToken;