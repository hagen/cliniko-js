module.exports = {
  "extends": "eslint:recommended",
  "env": {
    "node" : true,
    "browser": false
  },
  "globals": {"Promise": true},
  "rules" : {
    "semi": 0,
    "no-undef": "error",
    "no-console": ["error", { allow: ["warn", "error"]}]
  },
  "parserOptions": {
    "ecmaVersion": 6
  }
}
