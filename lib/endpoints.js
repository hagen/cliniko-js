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
  id,
  appointment_id,
  appointment_type_id,
  booking_id,
  business_id,
  patient_id,
  practitioner_id,
  repeated_from_id,
  tax_id,
  issue_date,
  number,
  status,
  created_at,
  updated_at,
  starts_at,
  ends_at,
  date_of_birth,
  email,
  first_name,
  last_name,
  old_reference_id
] = [
  'id',
  'appointment_id',
  'appointment_type_id',
  'booking_id',
  'business_id',
  'patient_id',
  'practitioner_id',
  'repeated_from_id',
  'tax_id',
  'issue_date',
  'number',
  'status',
  'created_at',
  'updated_at',
  'starts_at',
  'ends_at',
  'date_of_birth',
  'email',
  'first_name',
  'last_name',
  'old_reference_id'
]
const DEFAULT_FILTERS = [created_at, updated_at, id]
module.exports = [
  {
    name: "appointment types",
    path: "/appointment_types",
    methods: [get],
    filters: DEFAULT_FILTERS
  },
  {
    name: "attendees",
    entity: "attendees",
    path: "/attendees",
    methods: [get, create, update, del],
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
    methods: [get],
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
    methods: [get],
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
    methods: [get, create],
    filters: DEFAULT_FILTERS.concat([business_id, patient_id, practitioner_id, starts_at]),
  },
  {
    name : "billable items",
    entity: "billable_items",
    path: "/billable_items",
    methods: [get, create, update, del],
    filters: DEFAULT_FILTERS.concat([tax_id]),
  },
  {
    name : "businesses",
    entity: "businesses",
    path: "/businesses",
    methods: [get],
    filters: DEFAULT_FILTERS,
  },
  {
    name : "concession types",
    entity: "concession_types",
    path: "/concession_types",
    methods: [get],
    filters: DEFAULT_FILTERS,
  },
  {
    name : "contacts",
    entity: "contacts",
    path: "/contacts",
    methods: [get],
    filters: DEFAULT_FILTERS,
  },
  {
    name: "Daily Availabilities",
    entity: "daily_availabilities",
    path: "/daily_availabilities",
    methods: [get],
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
    methods: [get, create, update, del],
    filters: DEFAULT_FILTERS.concat([appointment_type_id, business_id, ends_at, practitioner_id, repeated_from_id]),
  },
  {
    name : "deleted group appointments",
    entity: "group_appointments",
    path: "/group_appointments/deleted",
    methods: [get],
    filters: DEFAULT_FILTERS.concat([appointment_type_id, business_id, ends_at, practitioner_id, repeated_from_id]),
  },
  {
    name: "conflicts",
    path: "/conflicts",
    entity: "conflicts",
    methods: [get],
    nested_only: true, // Only create the nested versions of this function
    filters: DEFAULT_FILTERS.concat([appointment_type_id, business_id, ends_at, practitioner_id, repeated_from_id]),
    nested: [{
      name: "group appointments",
      path: "/group_appointments/:id"
    }]
  },
  {
    name: "individual appointments",
    entity: "individual_appointments",
    path: "/individual_appointments",
    methods: [get, create, update, del],
    filters: DEFAULT_FILTERS.concat([appointment_type_id, business_id, ends_at, practitioner_id, repeated_from_id]),
  },
  {
    name : "deleted individual appointments",
    entity: "individual_appointments",
    path: "/individual_appointments/deleted",
    methods: [get],
    filters: DEFAULT_FILTERS.concat([appointment_type_id, business_id, ends_at, practitioner_id, repeated_from_id]),
  },
  {
    name : "cancelled individual appointments",
    entity: "individual_appointments",
    path: "/individual_appointments/cancelled",
    methods: [get],
    filters: DEFAULT_FILTERS.concat([appointment_type_id, business_id, ends_at, practitioner_id, repeated_from_id]),
  },
  {
    name: "conflicts",
    path: "/conflicts",
    entity: "conflicts",
    methods: [get],
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
    methods: [get],
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
    methods: [get],
    singularise: false,
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
    methods: [get],
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
    methods: [get],
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
    methods: [get, create, update, del],
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
    methods: [get],
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
    methods: [get, create, update, del],
    filters: DEFAULT_FILTERS.concat([date_of_birth, email, first_name, last_name, old_reference_id]),
  },
  {
    name : "deleted patients",
    entity: "patients",
    path: "/patients/deleted",
    methods: [get],
    filters: DEFAULT_FILTERS.concat([date_of_birth, email, first_name, last_name, old_reference_id]),
  },
  {
    name : "archived patients",
    entity: "patients",
    path: "/patients/archived",
    methods: [get],
    filters: DEFAULT_FILTERS.concat([date_of_birth, email, first_name, last_name, old_reference_id]),
  },
  {
    name : "",
    path: "/patients/",
    methods: [archive],
    nested_only: true,
    nested: [
      {
        name: "patients",
        path: "/patients/:id"
      }
    ]
  },
  {
    name : "",
    path: "/patients/",
    methods: [unarchive],
    nested_only: true,
    nested: [
      {
        name: "patients",
        path: "/patients/:id"
      }
    ]
  },
  {
    name : "practitioner reference numbers",
    entity: "practitioner_reference_numbers",
    path: "/practitioner_reference_numbers",
    nested_only: true,
    methods: [get],
    filters: DEFAULT_FILTERS.concat([business_id, practitioner_id,]),
    nested: [
      {
        name: "practitioners",
        path: "/practitioners/:id"
      }
    ]
  },
  {
    name : "practitioner reference numbers",
    entity: "practitioner_reference_numbers",
    path: "/patients",

    methods: [get],
    filters: DEFAULT_FILTERS.concat([date_of_birth, email, first_name, last_name, old_reference_id]),
  },
  {
    name : "users",
    entity: "users",
    path: "/users",
    methods: ["get"]
  },
  {
    name : "user",
    path: "/user",
    methods: ["get"]
  }
]
