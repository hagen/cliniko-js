const fields = [
  { name : "practitioners", type : "link", rename : "practitioner_ids" },
  { name : "appointment_type", type : "link", rename : "appointment_type_id" },
  { name : "business", type : "link", rename : "business_id" }
]

module.exports = {
  fields
}
