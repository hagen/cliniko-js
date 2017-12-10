const Cliniko = require('./').Cliniko
const opts = {
  api_key: null,
  user_agent: null,
  retries : 3
}
const cliniko = new Cliniko(opts)
cliniko.getPublicSettings().then(console.log)
const cliniko1 = new Cliniko(opts)
cliniko1.getSettings().then(console.log)
const cliniko2 = new Cliniko(opts)
cliniko2.getUser().then(console.log)
