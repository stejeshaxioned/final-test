const jwt = require('jsonwebtoken');

exports.authUser = (req, res, next) => {
  const token = req.header('auth-token');
  if (!token) {
    return res
      .status(401)
      .send({ error: 'Access Denied.', success: false, data: null });
  }

  try {
    const result = jwt.verify(token, process.env.JWT_SECRET);
    if (!result) {
      return res
        .status(401)
        .send({ error: 'Access Denied.', success: false, data: null });
    }
    req.userId = result.id;
    next();
  } catch (error) {
    console.error(error.message);
    res
      .status(401)
      .send({
        error: 'Session Expired. Please Login Again.',
        success: false,
        data: null
      });
  }
};
