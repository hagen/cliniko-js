const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)
cliniko.getPatient(45613680)
  .then((results) => {
    console.log("Patient")
    console.log(JSON.stringify(results, null, 2))
  })
