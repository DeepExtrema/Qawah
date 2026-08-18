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

  // Field-keyed detail rides alongside the summary message so a form can mark
  // the offending inputs. Only ever set for 4xx, since a 500's message is
  // deliberately generic.
  const error = { message, code };
  if (status < 500 && err.fields) error.fields = err.fields;

  res.status(status).json({ error, message });
}

module.exports = errorHandler;
