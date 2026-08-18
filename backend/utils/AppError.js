class AppError extends Error {
  /*
   * `fields` is an optional { fieldName: message } map. A form that submits
   * four things at once can then pin each problem to the input that caused it,
   * instead of showing one sentence for the whole form and making the customer
   * guess which box it refers to. errorHandler passes it through as
   * error.fields; routes that have no use for it simply omit the argument.
   */
  constructor(message, status = 400, code = "BAD_REQUEST", fields = null) {
    super(message);
    this.status = status;
    this.statusCode = status;
    this.code = code;
    if (fields && Object.keys(fields).length > 0) this.fields = fields;
  }
}

module.exports = AppError;
