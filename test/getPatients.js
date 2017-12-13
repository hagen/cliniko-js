const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)
const search = [
  ["first_name ~~ ?", "Hagen"]
]
cliniko.getPatients({ search })
  .then((results) => {
    console.log("Patient search")
    console.log(JSON.stringify(results, null, 2))
  })
