const Cliniko = require('./').Cliniko
const opts = {
  api_key: "",
  user_agent: "Hagen (hagen@cliniconnect.io)",
  retries : 3
}
const cliniko = new Cliniko(opts)
cliniko.getPatients(45489340)
  .then((results) => {
    console.log("Patient")
    console.log(JSON.stringify(results, null, 2))
    const search = [
      ["first_name ~~ ?", "Hagen"]
    ]
    return cliniko.getPatients({ search })
  })
  .then((results) => {
    console.log("Patient search")
    console.log(JSON.stringify(results, null, 2))
    return cliniko.getSettings()
  })
  .then((results) => {
    console.log("Settings")
    console.log(JSON.stringify(results, null, 2))
    return cliniko.getPublicSettings()
  })
  .then((results) => {
    console.log("Public Settings")
    console.log(JSON.stringify(results, null, 2))
    return cliniko.getUser()
  })
  .then((results) => {
    console.log("User")
    console.log(JSON.stringify(results, null, 2))
  })
