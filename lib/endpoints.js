module.exports = [
  // {
  //   endpoint_id : "cliniko-appointment-types",
  //   name : "appointment types",
  //   property_name : "appointment_types",
  //   path  : "/appointment_types",
  // },
  // {
  //   endpoint_id : "cliniko-attendees",
  //   name : "attendees",
  //   property_name : "attendees",
  //   path  : "/attendees",
  // },
  // {
  //   endpoint_id : "cliniko-attendees-deleted",
  //   name : "attendees (deleted)",
  //   property_name : "attendees",
  //   path  : "/attendees/deleted",
  // },
  // {
  //   endpoint_id : "cliniko-availability-blocks",
  //   name : "availability blocks",
  //   property_name : "availability_blocks",
  //   path  : "/availability_blocks",
  // },
  // {
  //   endpoint_id : "cliniko-billable-items",
  //   name : "billable items",
  //   property_name : "billable_items",
  //   path  : "/billable_items",
  // },
  // {
  //   endpoint_id : "cliniko-businesses",
  //   name : "businesses",
  //   property_name : "businesses",
  //   path  : "/businesses",
  // },
  // {
  //   endpoint_id : "cliniko-concession-types",
  //   name : "concession types",
  //   property_name : "concession_types",
  //   path  : "/concession_types",
  // },
  // {
  //   endpoint_id : "cliniko-contacts",
  //   name : "contacts",
  //   property_name : "contacts",
  //   path  : "/contacts",
  // },
  // {
  //   endpoint_id : "cliniko-products",
  //   name : "products",
  //   property_name : "products",
  //   path  : "/products",
  // },
  // {
  //   endpoint_id : "cliniko-taxes",
  //   name : "taxes",
  //   property_name : "taxes",
  //   path  : "/taxes",
  // },
  // {
  //   endpoint_id : "cliniko-practitioners",
  //   name : "practitioners",
  //   property_name : "practitioners",
  //   path  : "/practitioners",
  // },
  // {
  //   endpoint_id : "cliniko-practitioners-inactive",
  //   name : "practitioners",
  //   property_name : "practitioners",
  //   path  : "/practitioners/inactive",
  // },
  {
    name : "patients",
    entity: "patients",
    path  : "/patients",
    methods: ["get","create","update","delete"]
  },
  {
    name : "settings",
    path  : "/settings",
    methods: ["get"]
  },
  {
    name : "public settings",
    path  : "/settings/public",
    methods: ["get"]
  },
  // {
  //   endpoint_id : "cliniko-patients-deleted",
  //   name : "patients (deleted)",
  //   property_name : "patients",
  //   path  : "/patients/deleted",
  // },
  // {
  //   endpoint_id : "cliniko-individual-appointments",
  //   name : "individual appointments",
  //   property_name : "individual_appointments",
  //   path  : "/individual_appointments",
  // },
  // {
  //   endpoint_id : "cliniko-individual-appointments-deleted",
  //   name : "individual appointments (deleted)",
  //   property_name : "individual_appointments",
  //   path  : "/individual_appointments/deleted",
  // },
  // {
  //   endpoint_id : "cliniko-individual-appointments-cancelled",
  //   name : "individual appointments (cancelled)",
  //   property_name : "individual_appointments",
  //   path  : "/individual_appointments/cancelled",
  // },
  // {
  //   endpoint_id : "cliniko-group-appointments",
  //   name : "group appointments",
  //   property_name : "group_appointments",
  //   path  : "/group_appointments",
  // },
  // {
  //   endpoint_id : "cliniko-group-appointments-deleted",
  //   name : "group appointments (deleted)",
  //   property_name : "group_appointments",
  //   path  : "/group_appointments/deleted",
  // },
  // {
  //   endpoint_id : "cliniko-invoices",
  //   name : "invoices",
  //   property_name : "invoices",
  //   path  : "/invoices",
  // },
  // {
  //   endpoint_id : "cliniko-invoices-deleted",
  //   name : "invoices (deleted)",
  //   property_name : "invoices",
  //   path  : "/invoices/deleted",
  // },
  // {
  //   endpoint_id : "cliniko-invoice-items",
  //   name : "invoice_items",
  //   property_name : "invoice_items",
  //   path  : "/invoice_items",
  // },
  // {
  //   endpoint_id : "cliniko-invoice-items-deleted",
  //   name : "invoice_items (deleted)",
  //   property_name : "invoice_items",
  //   path  : "/invoice_items/deleted",
  // },
  // {
  //   endpoint_id : "cliniko-medical-alerts",
  //   name : "medical alerts",
  //   property_name : "medical_alerts",
  //   path  : "/medical_alerts",
  // },
  // {
  //   endpoint_id : "cliniko-medical-alerts-deleted",
  //   name : "medical alerts (deleted)",
  //   property_name : "medical_alerts",
  //   path  : "/medical_alerts/deleted",
  // },
  // {
  //   endpoint_id : "cliniko-referral-source-types",
  //   name : "referral source types",
  //   property_name : "referral_source_types",
  //   path  : "/referral_source_types",
  // },
  // {
  //   endpoint_id : "cliniko-referral-sources",
  //   name : "referral sources",
  //   property_name : "referral_sources",
  //   path  : "/referral_sources",
  // },
  // {
  //   endpoint_id : "cliniko-services",
  //   name : "services",
  //   property_name : "services",
  //   path  : "/services",
  // },
  // {
  //   endpoint_id : "cliniko-stock-adjustments",
  //   name : "stock adjustments",
  //   property_name : "stock_adjustments",
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
