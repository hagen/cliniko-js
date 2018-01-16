const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)
const per_page = 1
const follow = true
console.log('Patient follow search')
cliniko.on('data', (records) => {
  console.log(JSON.stringify(records, null, 2))
})
cliniko.on('done', (summary) => {
  console.log(JSON.stringify(summary, null, 2))
  console.log('Done')
})
cliniko.getPatients({ per_page, follow })
