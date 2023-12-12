const jwtDecode = require('../utility/JwtDecoder');

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied' });
    }

    try {
        const decoded = jwtDecode(token);
        req.user = decoded;
        next();
    } catch (error) {
        console.log("verifyToken=>catch=====>", error.message);
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

module.exports = verifyToken;