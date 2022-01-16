module.exports = {
  plugins: [
    "eta"
  ],
  overrides: [
    {
      files: ["*.eta"],
      processor: "eta/eta"
    }
  ],
};
