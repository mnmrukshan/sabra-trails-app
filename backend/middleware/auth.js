const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');
const User = require('../models/User');

// Configure JWKS client to fetch public keys from Asgardeo
const client = jwksRsa({
  jwksUri: 'https://api.asgardeo.io/t/sabratrails/oauth2/jwks',
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

// Helper to get signing key
function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) {
      return callback(err);
    }
    const signingKey = key.getPublicKey() || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Helper to resolve display name from claims
function resolveDisplayName(claims) {
  const clientId = '6Yh6Ri4GYfNGZf2GNEmGb8DXr04a';
  const candidates = [
    claims.given_name && claims.family_name ? `${claims.given_name} ${claims.family_name}` : null,
    claims.given_name,
    claims.family_name,
    claims.name,
    claims.preferred_username,
    claims.username,
    claims.email ? claims.email.split('@')[0] : null,
    claims.sub ? claims.sub.split('@')[0] : null,
  ];

  for (const name of candidates) {
    if (name && typeof name === 'string' && name.trim() !== '' && name !== clientId) {
      const cleanName = name.trim();
      return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    }
  }
  return 'Rukshan';
}

// Authentication Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header is missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    let decodedClaims = null;

    // Method 1: Try Local Cryptographic JWT Verification (using JWKS keys)
    try {
      decodedClaims = await new Promise((resolve, reject) => {
        jwt.verify(
          token,
          getKey,
          {
            algorithms: ['RS256'],
            // Flexible verification: check for standard Asgardeo issuers
            issuer: [
              'https://api.asgardeo.io/t/sabratrails/oauth2/token',
              'https://api.asgardeo.io/t/sabratrails/oauth2/token/'
            ]
          },
          (err, decoded) => {
            if (err) reject(err);
            else resolve(decoded);
          }
        );
      });
      console.log('Token verified locally via JWKS keys.');
    } catch (jwtErr) {
      console.log('Local JWT verification failed or token is opaque. Falling back to Asgardeo UserInfo endpoint...', jwtErr.message);

      // Method 2: Fallback to Asgardeo UserInfo validation (works for opaque access tokens)
      try {
        const userInfoRes = await fetch('https://api.asgardeo.io/t/sabratrails/oauth2/userinfo', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (userInfoRes.ok) {
          decodedClaims = await userInfoRes.json();
          console.log('Token verified successfully via UserInfo endpoint.');
        } else {
          const errText = await userInfoRes.text();
          console.error('Asgardeo UserInfo endpoint returned error:', errText);
        }
      } catch (fetchErr) {
        console.error('Error fetching Asgardeo UserInfo:', fetchErr.message);
      }
    }

    if (!decodedClaims) {
      return res.status(401).json({ error: 'Invalid, expired, or untrusted authentication token' });
    }

    // Extract core profile properties from claims
    const sub = decodedClaims.sub;
    const email = decodedClaims.email || (decodedClaims.username && decodedClaims.username.includes('@') ? decodedClaims.username : null);
    
    if (!sub) {
      return res.status(401).json({ error: 'Token claims do not contain a subject identifier (sub)' });
    }

    const name = resolveDisplayName(decodedClaims);

    // Sync/Upsert user in MongoDB
    let user = await User.findOne({ asgardeoId: sub });
    
    if (!user) {
      // If user doesn't exist by asgardeoId, check by email to merge accounts if appropriate
      if (email) {
        user = await User.findOne({ email: email.toLowerCase() });
      }

      if (user) {
        // Link Asgardeo ID to existing user record
        user.asgardeoId = sub;
        if (!user.name) user.name = name;
        await user.save();
        console.log(`Linked Asgardeo ID to existing user account: ${email}`);
      } else {
        // Create brand new user
        user = new User({
          asgardeoId: sub,
          email: email ? email.toLowerCase() : `${sub}@temporary.sabratrails.com`,
          name: name,
          savedTrails: []
        });
        await user.save();
        console.log(`Created new database user profile: ${user.name} (${user.email})`);
      }
    } else {
      // User exists, update name if needed
      let hasUpdates = false;
      if (email && user.email !== email.toLowerCase()) {
        user.email = email.toLowerCase();
        hasUpdates = true;
      }
      if (name && user.name !== name) {
        user.name = name;
        hasUpdates = true;
      }
      if (hasUpdates) {
        await user.save();
        console.log(`Updated database profile for user: ${user.name}`);
      }
    }

    // Attach user record to request for subsequent middleware and routes
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware server error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

module.exports = authMiddleware;
