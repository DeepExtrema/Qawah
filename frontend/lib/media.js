/**
 * Editorial images that are not product photography.
 *
 * Each value is empty until the artwork exists. ProductImage falls back to its
 * placeholder on an empty src, so an unset entry degrades to the same box that
 * was previously hard-coded into the page, rather than to a broken image.
 *
 * To add one: save the file under frontend/public/editorial/ and set the path
 * here. Nothing else needs to change.
 *
 *   RECIPE_CARD_IMAGE  = "/editorial/qahwa-ibrik.png";
 *   SUBSCRIPTION_IMAGE = "/editorial/subscription.png";
 *   WHOLESALE_IMAGE    = "/editorial/wholesale.png";
 */

// Learn page, recipe card. Landscape, roughly 3:2.
export const RECIPE_CARD_IMAGE = "";

// Home page promo, subscription. Small landscape, roughly 5:4.
export const SUBSCRIPTION_IMAGE = "";

// Home page promo, wholesale and trade. Small landscape, roughly 5:4.
export const WHOLESALE_IMAGE = "";
