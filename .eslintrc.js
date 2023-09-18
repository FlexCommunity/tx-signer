module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
  ],
  rules: {
    // override/add rules settings here, such as:
    "vue/max-attributes-per-line": ["error", {
      "singleline": {
        "max": 5
      },
      "multiline": {
        "max": 5
      }
    }],
  }
}
