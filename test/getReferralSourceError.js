const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)
cliniko.getReferralSource()
  .then(console.log)
  .catch(console.error)
