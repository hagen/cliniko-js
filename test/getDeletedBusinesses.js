const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)
cliniko.getDeletedBusinesses()
  .then((results) => {
    console.log('Deleted business listing')
    console.log(JSON.stringify(results, null, 2))
  })
