const configJSON = require("../config.json");

// Get the current environment from .env, default to 'staging'
const env = process.env.NODE_ENV;

if (!env) {
  throw new Error("mode is not specified")
}

// Export only the emojis for the active environment
module.exports = {
  env,
  emojis: configJSON[env]["emojis"],
  ids: configJSON[env]["ids"],
};
