function errorHandler(err, req, res, next) {
  const route = `${req.method} ${req.originalUrl || req.url}`;
  console.error(`[error] ${route}`, err && err.stack ? err.stack : err);

  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;
  const message =
    status >= 500
      ? "Something went wrong. Please try again."
      : err.message || "Request failed.";
  const code = err.code || (status >= 500 ? "SERVER_ERROR" : "BAD_REQUEST");

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      error: {
        message: "Image must be 5 MB or smaller.",
        code: "FILE_TOO_LARGE",
      },
    });
  }

  res.status(status).json({
    error: { message, code },
    message,
  });
}

module.exports = errorHandler;
