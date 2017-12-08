const Cliniko = require('./index')
const opts = {
  api_key: "",
  user_agent: "Test user-agent"
}
const cliniko = new Cliniko(opts)
cliniko.Settings().Public().get()
  .then(console.log)

cliniko.Settings().get()
  .then(console.log)

cliniko.User().get()
  .then(console.log)
