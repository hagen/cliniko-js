const DEFAULT_FILTERS = ["created_at", "updated_at", "id"]
module.exports = [
  {
    name: "appointment types",
    path: "/appointment_types",
    methods: ["get"],
    filters: DEFAULT_FILTERS
  },
  {
    name: "attendees",
    entity: "attendees",
    path: "/attendees",
    methods: ["get", "delete", "update", "create"],
    filters: DEFAULT_FILTERS.concat(["booking_id", "patient_id"]),
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
    methods: ["get"],
    filters: DEFAULT_FILTERS.concat(["booking_id", "patient_id"]),
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
    methods: ["get"],
    filters: DEFAULT_FILTERS.concat(["booking_id", "patient_id"]),
    nested: [{
      name: "group appointments",
      path: "/group_appointments/:id/attendees"
    }, {
      name: "individual appointments",
      path: "/individual_appointments/:id/attendees"
    }]
  },
  // {
  //   name : "attendees (deleted)",
  //   entity : "attendees",
  //   path  : "/attendees/deleted",
  // },
  // {
  //   name : "availability blocks",
  //   entity : "availability_blocks",
  //   path  : "/availability_blocks",
  // },
  // {
  //   name : "billable items",
  //   entity : "billable_items",
  //   path  : "/billable_items",
  // },
  // {
  //   name : "businesses",
  //   entity : "businesses",
  //   path  : "/businesses",
  // },
  // {
  //   name : "concession types",
  //   entity : "concession_types",
  //   path  : "/concession_types",
  // },
  // {
  //   name : "contacts",
  //   entity : "contacts",
  //   path  : "/contacts",
  // },
  // {
  //   name : "products",
  //   entity : "products",
  //   path  : "/products",
  // },
  // {
  //   name : "taxes",
  //   entity : "taxes",
  //   path  : "/taxes",
  // },
  // {
  //   name : "practitioners",
  //   entity : "practitioners",
  //   path  : "/practitioners",
  // },
  // {
  //   name : "practitioners",
  //   entity : "practitioners",
  //   path  : "/practitioners/inactive",
  // },
  {
    name : "patients",
    entity: "patients",
    path  : "/patients",
    methods: ["get","create","update","delete"],
    filters: DEFAULT_FILTERS.concat(["date_of_birth", "email", "first_name", "last_name", "old_reference_id"]),
  },
  // {
  //   name : "settings",
  //   path  : "/settings",
  //   methods: ["get"]
  // },
  // {
  //   name : "public settings",
  //   path  : "/settings/public",
  //   methods: ["get"]
  // },
  // {
  //   name : "patients (deleted)",
  //   entity : "patients",
  //   path  : "/patients/deleted",
  // },
  // {
  //   name : "individual appointments",
  //   entity : "individual_appointments",
  //   path  : "/individual_appointments",
  // },
  // {
  //   name : "individual appointments (deleted)",
  //   entity : "individual_appointments",
  //   path  : "/individual_appointments/deleted",
  // },
  // {
  //   name : "individual appointments (cancelled)",
  //   entity : "individual_appointments",
  //   path  : "/individual_appointments/cancelled",
  // },
  // {
  //   name : "group appointments",
  //   entity : "group_appointments",
  //   path  : "/group_appointments",
  // },
  // {
  //   name : "group appointments (deleted)",
  //   entity : "group_appointments",
  //   path  : "/group_appointments/deleted",
  // },
  // {
  //   name : "invoices",
  //   entity : "invoices",
  //   path  : "/invoices",
  // },
  // {
  //   name : "invoices (deleted)",
  //   entity : "invoices",
  //   path  : "/invoices/deleted",
  // },
  // {
  //   name : "invoice_items",
  //   entity : "invoice_items",
  //   path  : "/invoice_items",
  // },
  // {
  //   name : "invoice_items (deleted)",
  //   entity : "invoice_items",
  //   path  : "/invoice_items/deleted",
  // },
  // {
  //   name : "medical alerts",
  //   entity : "medical_alerts",
  //   path  : "/medical_alerts",
  // },
  // {
  //   name : "medical alerts (deleted)",
  //   entity : "medical_alerts",
  //   path  : "/medical_alerts/deleted",
  // },
  // {
  //   name : "referral source types",
  //   entity : "referral_source_types",
  //   path  : "/referral_source_types",
  // },
  // {
  //   name : "referral sources",
  //   entity : "referral_sources",
  //   path  : "/referral_sources",
  // },
  // {
  //   name : "services",
  //   path  : "/services",
  //
  // },
  // {
  //   name : "stock adjustments",
  //   entity : "stock_adjustments",
  //   path  : "/stock_adjustments",
  // },
  {
    name : "users",
    entity: "users",
    path  : "/users",
    methods: ["get"]
  },
  {
    name : "user",
    path  : "/user",
    methods: ["get"]
  }
]
