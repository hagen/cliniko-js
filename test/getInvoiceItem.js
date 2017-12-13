const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)
console.log("Invoice item")
cliniko.getInvoiceItem(45880119)
  .then(console.log)
  .catch(console.error)
