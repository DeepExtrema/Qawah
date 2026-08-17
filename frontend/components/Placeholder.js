export default function Placeholder({
  label = "img",
  height,
  width,
  className = "",
}) {
  const style = {};
  if (height != null) {
    style.height = typeof height === "number" ? `${height}px` : height;
  }
  if (width != null) {
    style.width = typeof width === "number" ? `${width}px` : width;
  }

  return (
    <div className={`im ${className}`.trim()} style={style} aria-hidden="true">
      {label ? <span>{label}</span> : null}
    </div>
  );
}
