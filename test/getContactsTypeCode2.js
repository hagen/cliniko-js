const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)
const search = [['type_code = ?', 2]]
cliniko.getContacts({ search })
  .then((results) => {
    console.log('Contacts listing')
    console.log(JSON.stringify(results, null, 2))
  })
