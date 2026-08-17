"use client";

import { useCallback, useState } from "react";
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

  /*
   * Remember the src that failed rather than a boolean, so navigating to a
   * different product clears the failure automatically. A boolean would stay
   * true and hide the next image too.
   */
  const [failedSrc, setFailedSrc] = useState(null);

  /*
   * The markup is server-rendered, so the browser has usually already
   * requested the image and received its 404 before React hydrates and
   * attaches onError. That event is gone by then and the handler never fires.
   * This ref runs on mount and catches the case: an image that has finished
   * loading but has no intrinsic width failed.
   */
  const checkAlreadyFailed = useCallback((node) => {
    if (node && node.complete && node.naturalWidth === 0) {
      setFailedSrc(node.getAttribute("src"));
    }
  }, []);

  // Falling back on a load error, not just on an empty src, means a missing
  // file degrades to the same placeholder as no file at all instead of the
  // browser's broken-image icon.
  if (src && src !== failedSrc) {
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
        ref={checkAlreadyFailed}
        onError={() => setFailedSrc(src)}
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
