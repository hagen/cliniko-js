const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)

cliniko.on('data', (records) => {
  console.log(JSON.stringify(records, null, 2))
})
cliniko.on('done', (summary) => {
  console.log(JSON.stringify(summary, null, 2))
  console.log('Done')
})
console.log('Invoice items of an invoice')
cliniko.invoice(39795877).getInvoiceItems()
  .catch(console.error)
