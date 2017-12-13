const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)
console.log("Invoice")
cliniko.getInvoice(39795877)
  .then(console.log)
  .catch(console.error)
