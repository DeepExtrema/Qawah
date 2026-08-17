import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      /*
       * The React Compiler rules below are kept on as warnings rather than
       * errors, because the two patterns they flag here are deliberate:
       *
       * 1. Hydrating auth and cart state from localStorage (AuthContext,
       *    WishlistContext). localStorage does not exist during server
       *    rendering, so this genuinely cannot move into render or into lazy
       *    useState initialisation — an effect is the correct place for it.
       *
       * 2. Fetching a page's data on mount in the admin screens. The setState
       *    happens in an async continuation after the request resolves, not
       *    synchronously during the effect, so it does not cascade renders.
       *
       * They stay visible as warnings so genuinely accidental cascading
       * setState still gets surfaced in review.
       */
      "react-hooks/set-state-in-effect": "warn",
      // Fires when a component's existing useMemo cannot be auto-memoised by
      // the compiler. It is an optimisation notice, not a correctness problem.
      "react-hooks/incompatible-library": "warn",
    },
  },
]);

export default eslintConfig;
