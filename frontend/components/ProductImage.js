import Placeholder from "./Placeholder";
import { API } from "../lib/api";
import { resolveImageSrc } from "../lib/imageSrc.mjs";

export default function ProductImage({
  src: rawSrc,
  alt = "",
  label = "img",
  height,
  width,
  className = "",
}) {
  // Every product image in the app renders through this component, so it is
  // the single place that needs to know how a stored imageUrl maps to a
  // loadable URL.
  const src = resolveImageSrc(rawSrc, API);

  if (src) {
    const style = {};
    if (height != null) {
      style.height = typeof height === "number" ? `${height}px` : height;
    }
    if (width != null) {
      style.width = typeof width === "number" ? `${width}px` : width;
    }

    return (
      <img
        src={src}
        alt={alt}
        className={`im product-photo ${className}`.trim()}
        style={style}
      />
    );
  }

  return (
    <Placeholder
      label={label}
      height={height}
      width={width}
      className={className}
    />
  );
}
