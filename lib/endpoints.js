const [
  get,
  list,
  create,
  update,
  cancel,
  del,
  archive,
  unarchive,
] = [
  "get",
  "list",
  "create",
  "update",
  "cancel",
  "delete",
  "archive",
  "unarchive",
]
const [
  id,  appointment_id,  appointment_type_id,  booking_id,  business_id,  patient_id,
  practitioner_id,  product_id,  repeated_from_id,  tax_id,  treatment_note_template_id,
  issue_date,  number,  status,  created_at,  updated_at,  starts_at,  ends_at,  date_of_birth,
  email,  first_name,  last_name,  old_reference_id,  user_id,  name
] = [
  'id','appointment_id','appointment_type_id','booking_id','business_id','patient_id',
  'practitioner_id','product_id','repeated_from_id','tax_id','treatment_note_template_id',
  'issue_date','number','status','created_at','updated_at','starts_at','ends_at','date_of_birth',
  'email','first_name','last_name','old_reference_id','user_id','name'
]
module.exports = [
  {
    name: "appointment types",
    path: "/appointment_types",
    methods: [get, list],
    filters: DEFAULT_FILTERS
  },
  {
    name: "attendees",
    entity: "attendees",
    path: "/attendees",
    methods: [get, list, create, update, del],
    filters: DEFAULT_FILTERS.concat([booking_id, patient_id]),
    nested: [
      {
        name: "group appointments",
        path: "/group_appointments/:id"
      },
      {
        name: "individual appointments",
        path: "/individual_appointments/:id"
      }
    ]
  },
  {
    name: "deleted attendees",
    entity: "attendees",
    path: "/attendees/deleted",
    methods: [list],
    filters: DEFAULT_FILTERS.concat([booking_id, patient_id]),
    nested: [{
      name: "group appointments",
      path: "/group_appointments/:id"
    }, {
      name: "individual appointments",
      path: "/individual_appointments/:id"
    }]
  },
  {
    name: "cancelled attendees",
    entity: "attendees",
    path: "/attendees/cancelled",
    methods: [list],
    filters: DEFAULT_FILTERS.concat([booking_id, patient_id]),
    nested: [{
      name: "group appointments",
      path: "/group_appointments/:id"
    }, {
      name: "individual appointments",
      path: "/individual_appointments/:id"
    }]
  },
  {
    name : "availability blocks",
    entity: "availability_blocks",
    path: "/availability_blocks",
    methods: [get, list, create],
    filters: DEFAULT_FILTERS.concat([business_id, patient_id, practitioner_id, starts_at]),
  },
  {
    name : "billable items",
    entity: "billable_items",
    path: "/billable_items",
    methods: [get, list, create, update, del],
    filters: DEFAULT_FILTERS.concat([tax_id]),
  },
  {
    name : "bookings",
    entity: "bookings",
    path: "/bookings",
    methods: [get, list],
    filters: DEFAULT_FILTERS.concat([business_id, ends_at, patient_ids, practitioner_id, starts_at]),
  },
  {
    name : "businesses",
    entity: "businesses",
    path: "/businesses",
    methods: [get, list],
    filters: DEFAULT_FILTERS,
  },
  {
    name : "concession types",
    entity: "concession_types",
    path: "/concession_types",
    methods: [get, list],
    filters: DEFAULT_FILTERS,
  },
  {
    name : "contacts",
    entity: "contacts",
    path: "/contacts",
    methods: [get, list],
    filters: DEFAULT_FILTERS,
  },
  {
    name: "Daily Availabilities",
    entity: "daily_availabilities",
    path: "/daily_availabilities",
    methods: [get, list],
    filters: DEFAULT_FILTERS.concat([business_id, practitioner_id]),
    nested: [{
      name: "businesses",
      path: "/businesses/:id"
    }, {
      name: "practitioners",
      path: "/practitioners/:id"
    }]
  },
  {
    name : "group appointments",
    entity: "group_appointments",
    path: "/group_appointments",
    methods: [get, list, create, update, del],
    filters: DEFAULT_FILTERS.concat([appointment_type_id, business_id, ends_at, practitioner_id, repeated_from_id]),
  },
  {
    name : "deleted group appointments",
    entity: "group_appointments",
    path: "/group_appointments/deleted",
    methods: [list],
    filters: DEFAULT_FILTERS.concat([appointment_type_id, business_id, ends_at, practitioner_id, repeated_from_id]),
  },
  {
    name: "conflicts",
    path: "/conflicts",
    methods: [get],
    filters: DEFAULT_FILTERS.concat([appointment_type_id, business_id, ends_at, practitioner_id, repeated_from_id]),
    no_id,
    nested_only, // Only create the nested versions of this function
    nested: [{
      name: "group appointments",
      path: "/group_appointments/:id"
    }]
  },
  {
    name: "individual appointments",
    entity: "individual_appointments",
    path: "/individual_appointments",
    methods: [get, list, create, update, del],
    filters: DEFAULT_FILTERS.concat([appointment_type_id, business_id, ends_at, practitioner_id, repeated_from_id]),
  },
  {
    name : "deleted individual appointments",
    entity: "individual_appointments",
    path: "/individual_appointments/deleted",
    methods: [list],
    filters: DEFAULT_FILTERS.concat([appointment_type_id, business_id, ends_at, practitioner_id, repeated_from_id]),
  },
  {
    name : "cancelled individual appointments",
    entity: "individual_appointments",
    path: "/individual_appointments/cancelled",
    methods: [list],
    filters: DEFAULT_FILTERS.concat([appointment_type_id, business_id, ends_at, practitioner_id, repeated_from_id]),
  },
  {
    name: "conflicts",
    path: "/conflicts",
    methods: [get],
    no_id: true,
    nested_only: true, // Only create the nested versions of this function
    filters: DEFAULT_FILTERS.concat([appointment_type_id, business_id, ends_at, practitioner_id, repeated_from_id]),
    nested: [{
      name: "individual appointments",
      path: "/individual_appointments/:id"
    }]
  },
  {
    name : "invoice items",
    entity: "invoice_items",
    path: "/invoice_items",
    methods: [get, list],
    filters: DEFAULT_FILTERS,
    nested: [{
      name: "invoices",
      path: "/invoices/:id"
    }]
  },
  {
    name : "deleted invoice items",
    entity: "invoice_items",
    path: "/invoice_items/deleted",
    methods: [list],
    filters: DEFAULT_FILTERS,
    nested: [{
      name: "invoices",
      path: "/invoices/:id"
    }]
  },
  {
    name : "invoices",
    entity: "invoices",
    path: "/invoices",
    methods: [get, list],
    filters: DEFAULT_FILTERS.concat([appointment_id, business_id, issue_date, number, patient_id, practitioner_id, status]),
    nested: [
      {
        name: "appointments",
        path: "/appointments/:id"
      },
      {
        name: "practitioners",
        path: "/practitioners/:id"
      },
      {
        name: "patients",
        path: "/patients/:id"
      },
    ]
  },
  {
    name : "deleted invoices",
    entity: "invoices",
    path: "/invoices/deleted",
    methods: [list],
    filters: DEFAULT_FILTERS.concat([appointment_id, business_id, issue_date, number, patient_id, practitioner_id, status]),
    nested: [
      {
        name: "appointments",
        path: "/appointments/:id"
      },
      {
        name: "practitioners",
        path: "/practitioners/:id"
      },
      {
        name: "patients",
        path: "/patients/:id"
      },
    ]
  },
  {
    name : "medical alerts",
    entity: "medical_alerts",
    path: "/medical_alerts",
    methods: [get, list, create, update, del],
    filters: DEFAULT_FILTERS.concat([patient_id]),
    nested: [
      {
        name: "patients",
        path: "/patients/:id"
      },
    ]
  },
  {
    name : "deleted medical alerts",
    entity: "medical_alerts",
    path: "/medical_alerts/deleted",
    methods: [list],
    filters: DEFAULT_FILTERS.concat([patient_id]),
    nested: [
      {
        name: "patients",
        path: "/patients/:id"
      },
    ]
  },
  {
    name : "patients",
    entity: "patients",
    path: "/patients",
    methods: [get, list, create, update, del, archive, unarchive],
    filters: DEFAULT_FILTERS.concat([date_of_birth, email, first_name, last_name, old_reference_id]),
  },
  {
    name : "deleted patients",
    entity: "patients",
    path: "/patients/deleted",
    methods: [list],
    filters: DEFAULT_FILTERS.concat([date_of_birth, email, first_name, last_name, old_reference_id]),
  },
  {
    name : "archived patients",
    entity: "patients",
    path: "/patients/archived",
    methods: [list],
    filters: DEFAULT_FILTERS.concat([date_of_birth, email, first_name, last_name, old_reference_id]),
  },
  // Practitioner reference numbers is a hairy one.
  // The list method is nested behind patients only. That is, you can't call:
  // /practitioner_reference_numbers to list them.
  // You may only call:
  // /patients/:id/practitioner_reference_numbers
  // So this first function configuration entry will create the list method,
  // patient(123456).getPractitionerReferenceNumbers()
  {
    name : "practitioner reference numbers",
    entity: "practitioner_reference_numbers",
    path: "/practitioner_reference_numbers",
    nested_only: true,
    methods: [list],
    filters: DEFAULT_FILTERS.concat([business_id, practitioner_id,]),
    nested: [
      {
        name: "practitioners",
        path: "/practitioners/:id"
      }
    ]
  },
  /**
   * This next definition will give us the singular get function, and the CUDs:
   * getPractitionerReferenceNumber(987654)
   */
  {
    name : "practitioner reference numbers",
    entity: "practitioner_reference_numbers",
    path: "/patients",
    methods: [get, create, update, del],
    filters: NO_FILTERS, // No filters for singular get
  },
  {
    name : "practitioners",
    entity: "practitioners",
    path: "/practitioners",
    methods: [get, list],
    filters: DEFAULT_FILTERS.concat([user_id]),
    nested: [
      {
        name: "appointment_types",
        path: "/appointment_types/:id"
      },
      {
        name: "businesses",
        path: "/businesses/:id"
      }
    ]
  },
  {
    name : "products",
    entity: "products",
    path: "/products",
    methods: [get, list, create, update, del],
    filters: DEFAULT_FILTERS.concat([tax_id, name]),
  },
  {
    name : "referral source types",
    entity: "referral_source_types",
    path: "/referral_source_types",
    methods: [get, list],
    filters: DEFAULT_FILTERS,
  },
  {
    name : "referral sources",
    entity: "referral_sources",
    path: "/referral_sources",
    methods: [list],
    filters: NO_FILTERS, // No filters
  },
  {
    name : "referral sources",
    path: "/referral_sources",
    methods: [get],
    filters: NO_FILTERS, // No filters
    nested_only,
    no_id, // This tells the factory that an ID field is not required for the singular get
    nested: [
      {
        name: "patients",
        path: "/patients/:id"
      }
    ]
  },
  {
    name : "services",
    entity: "services",
    path: "/services",
    methods: [list],
    filters: NO_FILTERS, // No filters
    nested: [
      {
        name: "businesses",
        path: "/businesses/:id"
      }
    ]
  },
  {
    name : "settings",
    path: "/settings",
    no_id: true, // This tells the factory that an ID field is not required for the singular get
    methods: [get],
    filters: NO_FILTERS, // No filters
  },
  {
    name : "public settings",
    path: "/settings/public",
    no_id: true, // This tells the factory that an ID field is not required for the singular get
    methods: [get],
    filters: NO_FILTERS, // No filters
  },
  {
    name : "stock adjustments",
    entity: "stock_adjustments",
    path: "/stock_adjustments",
    methods: [get, list, create],
    filters: DEFAULT_FILTERS.concat([product_id])
  },
  {
    name : "taxes",
    entity: "taxes",
    path: "/taxes",
    methods: [get, list, create, update, del],
    filters: DEFAULT_FILTERS,
  },
  {
    name : "treatment note templates",
    entity: "treatment_note_templates",
    path: "/treatment_note_templates",
    methods: [get, list, create, update, del],
    filters: NO_FILTERS,
  },
  {
    name : "treatment notes",
    entity: "treatment_notes",
    path: "/treatment_notes",
    methods: [get, list, create, update, del],
    filters: DEFAULT_FILTERS.concat([patient_id, practitioner_id, treatment_note_template_id]),
  },
  {
    name : "unavailable blocks",
    entity: "unavailable_blocks",
    path: "/unavailable_blocks",
    methods: [get, list, create, update, del],
    filters: DEFAULT_FILTERS.concat([business_id, ends_at, starts_at, practitioner_id, repeated_from_id]),
  },
  {
    name : "deleted unavailable blocks",
    entity: "unavailable_blocks",
    path: "/unavailable_blocks/deleted",
    methods: [list],
    filters: DEFAULT_FILTERS.concat([business_id, ends_at, starts_at, practitioner_id, repeated_from_id]),
  },
  {
    name : "conflicts",
    path: "/conflicts",
    methods: [get],
    filters: NO_FILTERS,
    nested_only: true,
    nested: [
      {
        name: "unavailable blocks",
        path: "/unavailable_blocks/:id"
      }
    ]
  },
  {
    name : "users",
    entity: "users",
    path: "/users",
    methods: [get, list],
    filters: NO_FILTERS
  },
  {
    name : "user",
    path: "/user",
    no_id: true,
    methods: [get],
    filters: NO_FILTERS
  }
]
