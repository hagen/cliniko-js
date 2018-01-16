const fields = [
  { name: 'repeats',
    type: 'custom',
    rename: 'repeats',
    delinker: (value) => {
    // For repeats, we're just checking if there's a repeats value populated.
    // In the JSON response, this is a URL to search all repeat appointments.
    // That's not much use to us here. Instead, we'll set a flag indicating
    // that repeats exist.
      if (value !== null) return true
      return value
    } },
  { name: 'repeated_from', type: 'link', rename: 'repeated_from_id' },
  { name: 'appointment_type', type: 'link', rename: 'appointment_type_id' },
  { name: 'business', type: 'link', rename: 'business_id' },
  { name: 'patient', type: 'link', rename: 'patient_id' },
  { name: 'practitioner', type: 'link', rename: 'practitioner_id' }
]

module.exports = {
  fields
}
