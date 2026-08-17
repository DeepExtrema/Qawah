/**
 * Editorial images that are not product photography.
 *
 * The files live in frontend/public/editorial/. If one is missing,
 * ProductImage falls back to its placeholder on the load error rather than
 * showing a broken image, so a path can be set here before the artwork lands.
 *
 * Two of these are portrait while their slots are landscape. That is handled:
 * .product-photo sets object-fit: cover, so they crop rather than distort.
 */

// Learn page, recipe card. Rendered at 120x78.
export const RECIPE_CARD_IMAGE = "/editorial/qahwa-ibrik.png";

// Home page promo, subscription. Rendered at 88x70.
export const SUBSCRIPTION_IMAGE = "/editorial/subscription.png";

// Home page promo, wholesale and trade. Rendered at 88x70.
export const WHOLESALE_IMAGE = "/editorial/wholesale.png";
