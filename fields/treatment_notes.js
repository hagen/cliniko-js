const fields = [
  { name: 'treatment_note_template', type: 'link', rename: 'treatment_note_template_id' },
  { name: 'patient', type: 'link', rename: 'patient_id' },
  { name: 'practitioner', type: 'link', rename: 'practitioner_id' }
]

module.exports = {
  fields
}
