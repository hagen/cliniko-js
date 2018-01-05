const fields = [
  { name : "content", type : "custom", rename : "content_uri", delinker: (value) => {
    if (typeof value !== 'object') return null
    return value.links.self
  }},
  { name : "patient", type : "link", rename : "patient_id" },
  { name : "user", type : "link", rename : "user_id" }
]

module.exports = {
  fields
}
