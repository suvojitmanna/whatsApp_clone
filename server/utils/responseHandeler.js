const response = (res, statusCode, message, data = null, errors = null) => {
  if (!res) {
    throw new Error("Response object is required");
  }

  const responseObject = {
    success: statusCode < 400,
    message,
    data,
    errors,
  };

  return res.status(statusCode).json(responseObject);
};

module.exports = response;