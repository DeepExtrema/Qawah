import Placeholder from "./Placeholder";

export default function ProductImage({
  src,
  alt = "",
  label = "img",
  height,
  width,
  className = "",
}) {
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
