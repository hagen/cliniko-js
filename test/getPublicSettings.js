const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)
cliniko.getPublicSettings()
  .then((results) => {
    console.log('Public settings')
    console.log(JSON.stringify(results, null, 2))
  })
