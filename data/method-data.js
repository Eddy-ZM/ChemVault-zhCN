window.CHEMVAULT_METHODS = {
  protocols: [
    {
      id: "claim-audit",
      title: "Claim Audit Protocol",
      domain: "Academic reasoning",
      level: "Core",
      summary: "Converts an informal chemistry statement into a testable claim with evidence type, source family, limitation and next validation step.",
      inputs: ["Proposed claim", "Evidence item", "Source family", "Known limitation"],
      outputs: ["Claim boundary", "Evidence grade", "Counterargument", "Next experiment"],
      checklist: [
        "The claim is written as a chemical assertion rather than a topic heading.",
        "A source family is attached to the evidence, not just listed at the end.",
        "A limitation is included before the conclusion is strengthened.",
        "Units, solvent, phase, temperature or substrate class are recorded where relevant."
      ],
      example: "Do not write 'PCC oxidizes alcohols.' Write 'PCC is commonly used for selective oxidation of many primary alcohols to aldehydes under anhydrous textbook conditions; substrate-specific procedure evidence is still required.'"
    },
    {
      id: "spectral-triangulation",
      title: "Spectral Triangulation Protocol",
      domain: "Analytical chemistry",
      level: "Core",
      summary: "Ranks a structural assignment by the number and independence of supporting spectral observations.",
      inputs: ["IR bands", "1H NMR features", "13C NMR features", "MS pattern", "Purity notes"],
      outputs: ["Assignment confidence", "Conflicting evidence", "Missing experiment", "Reference comparison target"],
      checklist: [
        "At least two independent observations support the same functional group.",
        "A diagnostic peak is not treated as complete structure proof.",
        "Integration, multiplicity and chemical shift are interpreted together.",
        "Impurity, solvent and concentration artefacts are considered."
      ],
      example: "A carbonyl IR band supports a carbonyl class; an aldehydic 1H signal and 13C carbonyl resonance make the aldehyde claim stronger."
    },
    {
      id: "route-comparison",
      title: "Route Comparison Protocol",
      domain: "Synthetic planning",
      level: "Advanced",
      summary: "Compares routes by selectivity, hazard, waste boundary, work-up burden, evidence level and operational simplicity.",
      inputs: ["Target transformation", "Candidate routes", "Functional groups", "Hazards", "Waste boundary"],
      outputs: ["Route ranking", "Rejected route rationale", "Green metric note", "Procedure-source target"],
      checklist: [
        "Yield is not used as the only route-quality metric.",
        "Hazard and work-up burden are stated separately from selectivity.",
        "Boundary assumptions are listed before an E-factor or waste claim.",
        "Procedure-specific evidence is requested before lab-scale recommendation."
      ],
      example: "A lower-yield route may be academically preferred if it avoids a severe hazard and reduces purification waste."
    },
    {
      id: "mechanism-discrimination",
      title: "Mechanism Discrimination Protocol",
      domain: "Physical organic chemistry",
      level: "Advanced",
      summary: "Uses substrate structure, solvent, stereochemistry, rate law and product distribution to choose between plausible mechanisms.",
      inputs: ["Substrate class", "Nucleophile or base", "Solvent", "Stereochemical result", "Rate data"],
      outputs: ["Mechanism hypothesis", "Evidence for", "Evidence against", "Decisive missing test"],
      checklist: [
        "A mechanism is treated as a constrained hypothesis rather than a memorized label.",
        "Rate-law evidence is separated from stereochemical evidence.",
        "Competing pathways are named when the same conditions could support them.",
        "The weakest assumption is explicitly identified."
      ],
      example: "A primary substrate and strong nucleophile support SN2, but solvent and steric context still matter."
    },
    {
      id: "reproducibility-ledger",
      title: "Reproducibility Ledger Protocol",
      domain: "Research recordkeeping",
      level: "Core",
      summary: "Tracks whether a claim has raw data, metadata, source link, uncertainty note and repeatability statement.",
      inputs: ["Observation", "Instrument or method", "Metadata", "Source", "Repeat note"],
      outputs: ["Completeness score", "Missing metadata", "Review action", "Publication risk"],
      checklist: [
        "Raw observation and processed interpretation are separated.",
        "Instrument, solvent or method metadata are present.",
        "Missing data are marked as missing rather than silently omitted.",
        "A review action is created for every incomplete record."
      ],
      example: "A spectral assignment without raw spectra can be useful for learning, but it should not be presented as publication-ready evidence."
    }
  ],
  rubric: [
    { grade: "A", name: "Primary measurement", standard: "Raw or evaluated numerical evidence with units, context and method metadata." },
    { grade: "B", name: "Checked procedure", standard: "Peer-reviewed or independently checked experimental procedure with characterization." },
    { grade: "C", name: "Formal terminology", standard: "Definition anchored in a controlled terminology source." },
    { grade: "D", name: "Heuristic", standard: "Teaching rule or planning pattern with explicit limits and mechanism rationale." },
    { grade: "E", name: "Speculation", standard: "Plausible but currently unsupported statement requiring a named validation step." }
  ],
  manuscriptSections: [
    {
      title: "Abstract",
      purpose: "State the chemical problem, method and main conclusion without overstating the evidence.",
      qualitySignal: "Contains one defensible claim and one boundary condition."
    },
    {
      title: "Methods",
      purpose: "Record conditions, data source, instrument context, calculation assumptions and selection criteria.",
      qualitySignal: "Another reader can identify what was measured or compared."
    },
    {
      title: "Evidence",
      purpose: "Separate observations from inferences so the argument can be audited.",
      qualitySignal: "Each inference points back to a specific observation."
    },
    {
      title: "Limitations",
      purpose: "Show where the claim stops and what further evidence would strengthen it.",
      qualitySignal: "At least one plausible counterargument is named."
    },
    {
      title: "Conclusion",
      purpose: "Resolve the research question using evidence strength rather than rhetorical certainty.",
      qualitySignal: "Confidence matches the weakest required evidence item."
    }
  ]
};
