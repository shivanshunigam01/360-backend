module.exports = schema => (req, res, next) => {
  const { error } = schema.body.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details.map(d => d.message).join(", ")
    });
  }

  next();
};
