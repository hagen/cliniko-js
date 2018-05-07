const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)
cliniko.getArchivedBusinesses()
  .then((results) => {
    console.log('Archived business listing')
    console.log(JSON.stringify(results, null, 2))
  })
