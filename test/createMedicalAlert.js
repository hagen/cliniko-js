const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)
console.log('Create medical alert for a Patient')
cliniko.createMedicalAlert({
  patient_id: 45489340,
  name: 'module test'
})
  .then(console.log)
  .catch(console.error)
