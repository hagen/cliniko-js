const fields = [
  { name : "practitioner", type : "link", rename : "practitioner_id" },
  { name : "appointment_type", type : "link", rename : "appointment_type_id" },
  { name : "business", type : "link", rename : "business_id" }
]

module.exports = {
  fields
}
