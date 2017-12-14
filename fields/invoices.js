const fields = [
  { name : "appointment", type : "link", rename : "appointment_id"},
  { name : "business", type : "link", rename : "business_id"},
  { name : "practitioner", type : "link", rename : "practitioner_id"},
  { name : "patient", type : "link", rename : "patient_id"}
]

module.exports = {
  fields
}
