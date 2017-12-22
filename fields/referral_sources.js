const fields = [
  { name : "referrer", type : "link", rename : "referrer_id" },
  { name : "patient", type : "link", rename : "patient_id" },
  { name : "referral_source_type", type : "link", rename : "referral_source_type_id" }
]

module.exports = {
  fields
}
