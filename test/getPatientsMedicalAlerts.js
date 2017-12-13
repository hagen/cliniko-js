const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)
console.log("Medical alerts of a Patient")
cliniko.patient(45489340).getMedicalAlerts()
  .then(console.log)
  .catch(console.error)
