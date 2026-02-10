function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Giriş tələb olunur' });
  }
  next();
}

module.exports = { requireAuth };
