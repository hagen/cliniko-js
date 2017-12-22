const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)
const per_page = 1
const follow = true
cliniko.getReferralSourceTypes({ per_page, follow })
  .then((results) => {
    console.log("Referral source types")
    console.log(JSON.stringify(results, null, 2))
    console.log("Summary")
    console.log(JSON.stringify(cliniko.summary(), null, 2))
  })
