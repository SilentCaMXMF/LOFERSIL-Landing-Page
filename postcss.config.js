import postcssImport from "postcss-import";
import autoprefixer from "autoprefixer";
import cssnano from "cssnano";

export default {
  plugins: [
    // Import CSS from other files
    postcssImport(),

    // Add vendor prefixes for better browser compatibility
    autoprefixer,

    // Minify CSS in production (with conservative settings to preserve min/max functions)
    process.env.NODE_ENV === "production"
      ? cssnano({
          preset: [
            "default",
            {
              discardComments: { removeAll: true },
              normalizeWhitespace: true,
              minifySelectors: true,
              minifyFontValues: false,
              minifyParams: false,
              convertValues: false,
              reduceIdents: false,
              colormin: true,
            },
          ],
        })
      : false,
  ].filter(Boolean),
};
