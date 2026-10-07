/* Instant-quote packages. Amounts in AUD cents for Stripe; display uses dollars. */
window.GLADSTONE_QUOTE_PACKAGES = {
  "real-estate": {
    id: "real-estate",
    title: "Real Estate Photography",
    serviceId: "aerial-photo",
    currency: "aud",
    /** Base package before location / property / add-ons */
    basePriceCents: 29900,
    baseLabel: "Standard real estate photo package",
    sections: [
      {
        id: "location",
        title: "1. Location",
        hint: "Where is the property located?",
        type: "single",
        required: true,
        options: [
          { id: "gladstone", label: "Gladstone", priceCents: 0 },
          { id: "boyne-tannum", label: "Boyne / Tannum", priceCents: 0 },
          { id: "calliope", label: "Calliope", priceCents: 0 },
          {
            id: "greater-region",
            label: "Greater Gladstone Region",
            priceCents: 10000,
          },
          { id: "elsewhere", label: "Elsewhere", inquire: true },
        ],
      },
      {
        id: "property",
        title: "2. Property type",
        hint: "Choose the property you want photographed.",
        type: "single",
        required: true,
        options: [
          { id: "residential", label: "Residential home", priceCents: 0 },
          {
            id: "acreage",
            label: "Acreage block (up to 4 acres)",
            priceCents: 5000,
          },
          {
            id: "rural",
            label: "Rural block (over 4 acres)",
            priceCents: 7500,
          },
          {
            id: "commercial",
            label: "Commercial office property",
            priceCents: 0,
          },
          { id: "industrial", label: "Industrial", priceCents: 10000 },
        ],
      },
      {
        id: "addons",
        title: "3. Optional add-ons",
        hint: "Choose as many as you need.",
        type: "multi",
        required: false,
        note: "Standard ocean or river views and high-tide views are alternative options.",
        exclusiveGroups: [["ocean-views", "ocean-high-tide"]],
        options: [
          { id: "urgent", label: "Urgent — 48 hours", priceCents: 10000 },
          { id: "golden-hour", label: "Golden hour", priceCents: 10000 },
          {
            id: "ocean-views",
            label: "Ocean or river views",
            priceCents: 5000,
          },
          {
            id: "ocean-high-tide",
            label: "Ocean or river views at high tide",
            priceCents: 10000,
          },
          {
            id: "landmarks",
            label: "Edit to include labelled landmarks",
            priceCents: 7500,
          },
        ],
      },
    ],
  },
};
