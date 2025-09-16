const jwt = require('jsonwebtoken');

const signToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

const createTokenResponse = (user) => {
    const token = signToken({
        userId: user.id,
        email: user.email,
        role: user.role
    });

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        }
    };
};

module.exports = {
    signToken,
    verifyToken,
    createTokenResponse
};
