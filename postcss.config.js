module.exports = {
  plugins: {
    autoprefixer: {},
    cssnano:
      process.env.NODE_ENV === "production"
        ? {
            preset: [
              "default",
              {
                discardComments: { removeAll: true },
                normalizeWhitespace: false,
              },
            ],
          }
        : false,
  },
};
