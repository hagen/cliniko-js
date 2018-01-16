const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)
cliniko.getServices()
  .then((results) => {
    console.log('Services listing')
    console.log(JSON.stringify(results, null, 2))
  })
