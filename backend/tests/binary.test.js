const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { toBuffer } = require("../utils/binary");

/*
 * Regression cover for a bug that shipped a 200 response with the correct
 * Content-Type and a completely corrupted image.
 *
 * A .lean() query returns a Buffer field as the MongoDB driver's Binary
 * wrapper rather than a Node Buffer. res.send() saw a plain object and
 * JSON-encoded it, turning 70 bytes of PNG into 98 bytes of JSON. Nothing
 * short of comparing the actual bytes catches that.
 */

// Stand-in for the driver's BSON Binary: an object wrapping a Buffer.
function fakeBinary(buf) {
  return { _bsontype: "Binary", sub_type: 0, position: buf.length, buffer: buf };
}

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("toBuffer", () => {
  it("passes a real Buffer through untouched", () => {
    const out = toBuffer(PNG);
    assert.ok(Buffer.isBuffer(out));
    assert.ok(out.equals(PNG));
  });

  it("unwraps a BSON Binary into the identical bytes", () => {
    const out = toBuffer(fakeBinary(PNG));
    assert.ok(Buffer.isBuffer(out), "must be a Buffer, or Express will JSON-encode it");
    assert.ok(out.equals(PNG), "bytes must survive the unwrap exactly");
    assert.equal(out.length, PNG.length);
  });

  it("handles a Binary whose payload is a typed array", () => {
    const out = toBuffer({ buffer: new Uint8Array(PNG) });
    assert.ok(Buffer.isBuffer(out));
    assert.ok(out.equals(PNG));
  });

  it("returns an empty Buffer for null or undefined rather than throwing", () => {
    assert.equal(toBuffer(null).length, 0);
    assert.equal(toBuffer(undefined).length, 0);
    assert.ok(Buffer.isBuffer(toBuffer(null)));
  });

  it("never returns a plain object, whatever it is given", () => {
    for (const input of [PNG, fakeBinary(PNG), null, undefined, Buffer.alloc(0)]) {
      assert.ok(Buffer.isBuffer(toBuffer(input)));
    }
  });
});
