// middleware/authorizeRoles.js

/**
 * authorizeRoles('manager'), authorizeRoles('manager','engineer')
 * usage: router.get('/some', verifyToken, authorizeRoles('manager', 'engineer'), handler)
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Forbidden. No role present.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
}

module.exports = authorizeRoles;
