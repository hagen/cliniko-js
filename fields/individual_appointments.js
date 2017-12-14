const fields = [
  { name : "appointment_type", type : "link", rename : "appointment_type_id" },
  { name : "business", type : "link", rename : "business_id" },
  { name : "patient", type : "link", rename : "patient_id" },
  { name : "practitioner", type : "link", rename : "practitioner_id" },
]

module.exports = {
  fields
}
