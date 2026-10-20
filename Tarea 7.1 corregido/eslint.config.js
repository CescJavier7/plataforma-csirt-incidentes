const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        document: "readonly",
        fetch: "readonly",
        alert: "readonly",
        require: "readonly",
        module: "readonly",
        describe: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        jest: "readonly"
      }
    },
    rules: {
      "eqeqeq": "error",
      "no-var": "error",
      "prefer-const": "warn",
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
    }
  },
  {
    ignores: ["coverage/**", "node_modules/**"]
  }
];