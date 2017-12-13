const Cliniko = require('../').Cliniko
const opts = require('./config')
const cliniko = new Cliniko(opts)

cliniko.on("data", (records) => {
  console.log(JSON.stringify(records, null, 2))
})
cliniko.on("done", (summary) => {
  console.log(JSON.stringify(summary, null, 2))
  console.log("Done")
})
console.log("Attendees of an appointment")
cliniko.individualAppointments(87666810).getAttendees()
  .catch(console.error)
