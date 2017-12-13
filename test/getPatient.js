const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)
cliniko.getPatients(45489340)
  .then((results) => {
    console.log("Patient")
    console.log(JSON.stringify(results, null, 2))
  })
