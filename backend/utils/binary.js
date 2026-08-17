/**
 * Normalises a binary field read from MongoDB into a Node Buffer.
 *
 * Why this is needed: a .lean() query skips Mongoose's document hydration,
 * which is what normally converts BSON types into their JavaScript
 * equivalents. A Buffer field therefore comes back as the driver's Binary
 * wrapper. Handing that straight to res.send() makes Express treat it as a
 * plain object and JSON-encode it, which silently corrupts the payload while
 * still returning a perfectly healthy-looking 200.
 *
 * Accepts a Node Buffer (hydrated documents) or a BSON Binary (lean queries).
 */
function toBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value && Buffer.isBuffer(value.buffer)) return value.buffer;
  if (value && value.buffer) return Buffer.from(value.buffer);
  if (value == null) return Buffer.alloc(0);
  return Buffer.from(value);
}

module.exports = { toBuffer };
