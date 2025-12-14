import autoprefixer from "autoprefixer";
import cssnano from "cssnano";

export default {
  plugins: [
    // Add vendor prefixes for better browser compatibility
    autoprefixer,

    // Minify CSS in production
    process.env.NODE_ENV === "production"
      ? cssnano({
          preset: [
            "default",
            {
              discardComments: { removeAll: true },
              normalizeWhitespace: true,
              minifySelectors: true,
              minifyFontValues: true,
              minifyParams: true,
              convertValues: true,
              reduceIdents: true,
              colormin: true,
            },
          ],
        })
      : false,
  ].filter(Boolean),
};
