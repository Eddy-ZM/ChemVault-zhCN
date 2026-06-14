window.CHEMVAULT_DOSSIERS = {
  dossiers: [
    {
      id: "carbonyl-forensics",
      title: "Carbonyl Forensics Dossier",
      field: "Spectroscopy and structure proof",
      status: "active",
      maturity: 86,
      abstract: "A structured case file for distinguishing aldehydes, ketones and acyl derivatives by converging IR, 1H NMR, 13C NMR and mass-spectral evidence.",
      keywords: ["IR", "1H NMR", "13C NMR", "carbonyl", "assignment"],
      methods: ["Triangulated spectral assignment", "Reference-range comparison", "Impurity and artefact audit"],
      observables: [
        "IR carbonyl region between 1680 and 1750 cm-1",
        "Downfield 1H NMR evidence near 9-10.5 ppm",
        "13C carbonyl resonance and isotope-pattern checks"
      ],
      claims: [
        "Aldehyde assignment requires evidence beyond an IR carbonyl band.",
        "Converging spectra are stronger than a single diagnostic peak.",
        "Reference comparison should include solvent, concentration and purity context."
      ],
      limitations: [
        "No two-dimensional NMR is embedded in the static prototype.",
        "Reference ranges are pedagogic summaries rather than full spectra.",
        "Authentic sample comparison remains the strongest confirmatory step."
      ],
      reproducibility: [
        { item: "Units recorded", state: "complete" },
        { item: "Source family linked", state: "complete" },
        { item: "Raw spectra archived", state: "missing" },
        { item: "Purity statement", state: "partial" }
      ],
      linked: [
        { label: "Open Research Desk case", href: "research.html?case=unknown-carbonyl" },
        { label: "Open Spectroscopy concept", href: "library.html?q=chemical%20shift" }
      ]
    },
    {
      id: "hydride-selectivity",
      title: "Hydride Selectivity Dossier",
      field: "Synthetic planning",
      status: "review",
      maturity: 78,
      abstract: "A chemoselectivity audit that compares NaBH4 and LiAlH4 using scope, functional-group tolerance, work-up burden and evidence level.",
      keywords: ["reduction", "selectivity", "hydride", "functional group tolerance"],
      methods: ["Scope comparison", "Functional-group risk table", "Route-context reasoning"],
      observables: [
        "Functional groups present in substrate",
        "Required reduction strength",
        "Moisture and work-up constraints"
      ],
      claims: [
        "A narrower reagent scope can be academically preferable when selectivity is the target.",
        "LiAlH4 is stronger than many first-pass aldehyde or ketone reductions require.",
        "A reagent recommendation should name the condition assumptions."
      ],
      limitations: [
        "Substrate-specific literature is still required for real synthesis planning.",
        "Stereochemical and protecting-group cases are simplified.",
        "Safety data must be checked outside the prototype before lab use."
      ],
      reproducibility: [
        { item: "Condition assumptions", state: "complete" },
        { item: "Competing reagent stated", state: "complete" },
        { item: "Procedure source linked", state: "partial" },
        { item: "Scale-specific risk", state: "missing" }
      ],
      linked: [
        { label: "Open Research Desk case", href: "research.html?case=reduction-selectivity" },
        { label: "Open NaBH4 record", href: "reagents.html?id=nabh4" },
        { label: "Open LiAlH4 record", href: "reagents.html?id=lialh4" }
      ]
    },
    {
      id: "aromatic-eas",
      title: "Aromatic Substitution Dossier",
      field: "Mechanistic organic chemistry",
      status: "active",
      maturity: 81,
      abstract: "A mechanism-first dossier for electrophilic aromatic substitution, connecting electrophile generation, sigma-complex stability, directing effects and loss of aromaticity.",
      keywords: ["EAS", "aromaticity", "electrophile", "directing effects"],
      methods: ["Mechanistic sequence mapping", "Substituent-effect table", "Counterexample register"],
      observables: [
        "Catalyst or acid activation",
        "Ring activation or deactivation",
        "Product regiochemistry"
      ],
      claims: [
        "Benzene bromination requires electrophile activation in standard teaching examples.",
        "Restoration of aromaticity explains substitution rather than permanent addition.",
        "Substituent effects must be separated from reagent strength."
      ],
      limitations: [
        "No kinetic dataset is included for comparing substituted rings.",
        "Reactive electrophile identity can vary with conditions.",
        "The dossier is a reasoning tool rather than a full computational study."
      ],
      reproducibility: [
        { item: "Mechanistic steps stated", state: "complete" },
        { item: "Terminology anchored", state: "complete" },
        { item: "Rate data supplied", state: "missing" },
        { item: "Regiochemical examples", state: "partial" }
      ],
      linked: [
        { label: "Open Research Desk case", href: "research.html?case=aromatic-bromination" },
        { label: "Open EAS atlas node", href: "atlas.html?id=eas" },
        { label: "Open bromination record", href: "reagents.html?id=br2-febr3" }
      ]
    },
    {
      id: "green-route-assessment",
      title: "Green Route Assessment Dossier",
      field: "Sustainability and route design",
      status: "draft",
      maturity: 69,
      abstract: "A route-evaluation dossier that treats yield, waste boundary, hazard, solvent burden and purification load as separate claims.",
      keywords: ["green chemistry", "E-factor", "yield", "hazard", "route selection"],
      methods: ["Boundary statement", "Metric comparison", "Hazard narrative"],
      observables: [
        "Isolated yield",
        "Mass of waste included in boundary",
        "Hazard and purification burden"
      ],
      claims: [
        "Yield alone is not a sufficient route-quality argument.",
        "E-factor claims require an explicitly stated mass boundary.",
        "A lower hazard route can be academically stronger even when yield is similar."
      ],
      limitations: [
        "No full inventory spreadsheet is connected yet.",
        "SDS-coded hazard scoring is represented narratively.",
        "Life-cycle assessment is outside the current static scope."
      ],
      reproducibility: [
        { item: "Boundary stated", state: "partial" },
        { item: "Metric formula included", state: "complete" },
        { item: "Inventory masses", state: "missing" },
        { item: "Hazard source", state: "partial" }
      ],
      linked: [
        { label: "Open Research Desk case", href: "research.html?case=green-route" },
        { label: "Open green metrics concept", href: "library.html?q=green%20metrics" }
      ]
    }
  ],
  methods: [
    {
      id: "spectral-triangulation",
      name: "Spectral triangulation",
      className: "Analytical validation",
      confidence: 88,
      note: "Assign structure only when independent spectral features point to the same chemical class."
    },
    {
      id: "claim-ladder",
      name: "Evidence claim ladder",
      className: "Academic writing",
      confidence: 91,
      note: "Separate reference data, checked procedures, formal terminology and teaching heuristics."
    },
    {
      id: "condition-register",
      name: "Condition register",
      className: "Synthetic method",
      confidence: 76,
      note: "Record solvent, atmosphere, work-up, scale and substrate assumptions before making route claims."
    },
    {
      id: "limitation-audit",
      name: "Limitation audit",
      className: "Peer review",
      confidence: 84,
      note: "Every strong claim should carry a boundary, counterexample or next experiment."
    }
  ],
  reviewQueue: [
    { item: "Attach raw spectra to Carbonyl Forensics", priority: "high", due: "next revision" },
    { item: "Add source-specific procedure links to Hydride Selectivity", priority: "medium", due: "methods pass" },
    { item: "Expand EAS examples with directing-effect cases", priority: "medium", due: "atlas pass" },
    { item: "Add inventory table for Green Route Assessment", priority: "high", due: "sustainability pass" }
  ],
  instruments: [
    { name: "FTIR", role: "Functional-group screening", output: "absorbance bands with diagnostic ranges" },
    { name: "1H NMR", role: "Proton-environment evidence", output: "shift, integration, multiplicity and coupling" },
    { name: "13C NMR", role: "Carbon skeleton evidence", output: "carbonyl, aromatic and heteroatom-adjacent regions" },
    { name: "MS", role: "Molecular ion and isotope support", output: "mass, fragmentation and halogen patterns" }
  ]
};
