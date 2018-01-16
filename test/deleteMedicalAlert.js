const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)
console.log('Delete medical alert')
cliniko.deleteMedicalAlert(909348)
  .then(console.log)
  .catch(console.error)
