window.CHEMVAULT_SPECTROSCOPY = {
  cases: [
    {
      id: "aldehyde-vs-ketone",
      title: "Aldehyde vs ketone discrimination",
      family: "Carbonyl assignment",
      confidence: 88,
      question: "Does the combined spectrum support an aldehyde rather than a ketone?",
      signals: [
        { technique: "IR", signal: "1718 cm-1", interpretation: "Carbonyl group present", strength: "supporting" },
        { technique: "1H NMR", signal: "9.8 ppm, 1H", interpretation: "Aldehydic proton", strength: "strong" },
        { technique: "13C NMR", signal: "ca. 200 ppm", interpretation: "Aldehyde or ketone carbonyl carbon", strength: "supporting" }
      ],
      conclusion: "The aldehydic 1H resonance is the discriminating observation; IR alone is insufficient.",
      missing: "2D NMR or authentic reference comparison would strengthen the assignment."
    },
    {
      id: "ester-hydrolysis-check",
      title: "Ester hydrolysis progress check",
      family: "Reaction monitoring",
      confidence: 72,
      question: "Do the spectra suggest conversion of an ester toward acid or alcohol products?",
      signals: [
        { technique: "IR", signal: "broad 2500-3300 cm-1", interpretation: "Carboxylic acid O-H may be emerging", strength: "supporting" },
        { technique: "IR", signal: "C=O shift", interpretation: "Carbonyl environment changed", strength: "moderate" },
        { technique: "1H NMR", signal: "alkoxy signal decreases", interpretation: "Ester substituent environment changed", strength: "moderate" }
      ],
      conclusion: "The evidence is consistent with hydrolysis progress but needs time-course or reference comparison.",
      missing: "Quantitative integration and isolated product characterization."
    },
    {
      id: "halogen-isotope",
      title: "Halogen isotope pattern audit",
      family: "Mass spectrometry",
      confidence: 80,
      question: "Does the molecular ion region support chlorine or bromine substitution?",
      signals: [
        { technique: "MS", signal: "M and M+2 pair", interpretation: "Halogen isotope pattern", strength: "strong" },
        { technique: "MS", signal: "ca. 1:1 intensity", interpretation: "Bromine is more likely than chlorine", strength: "strong" },
        { technique: "IR/NMR", signal: "No direct halogen proof", interpretation: "Other spectra constrain structure but do not replace isotope evidence", strength: "limiting" }
      ],
      conclusion: "A near 1:1 M/M+2 pattern is strong evidence for bromine, subject to molecular-ion assignment.",
      missing: "High-resolution mass and formula constraint."
    },
    {
      id: "aromatic-substitution-pattern",
      title: "Aromatic substitution pattern screen",
      family: "Aromatic structure",
      confidence: 66,
      question: "Can the aromatic region support a substituted benzene pattern?",
      signals: [
        { technique: "1H NMR", signal: "6.8-8.1 ppm multiplets", interpretation: "Aromatic protons", strength: "supporting" },
        { technique: "13C NMR", signal: "110-150 ppm", interpretation: "Aromatic carbon environments", strength: "supporting" },
        { technique: "1H NMR", signal: "integration pattern", interpretation: "May constrain substitution count", strength: "moderate" }
      ],
      conclusion: "The spectra support an aromatic ring but substitution pattern needs coupling analysis or 2D NMR.",
      missing: "COSY/HSQC/HMBC or authentic reference comparison."
    }
  ],
  instruments: [
    {
      id: "ftir",
      name: "FTIR",
      evidenceType: "Functional-group screening",
      strengths: ["Fast functional-group evidence", "Strong for carbonyl and O-H/N-H regions", "Useful reaction monitoring"],
      limitations: ["Peak overlap is common", "Functional group evidence is not complete structural proof", "Sample preparation can affect band shape"]
    },
    {
      id: "proton-nmr",
      name: "1H NMR",
      evidenceType: "Hydrogen environment mapping",
      strengths: ["Integration and multiplicity give high information density", "Downfield aldehyde and aromatic regions can be diagnostic", "Coupling supports connectivity"],
      limitations: ["Exchangeable protons can broaden or disappear", "Impurities and solvent peaks can mislead", "Complex mixtures need careful deconvolution"]
    },
    {
      id: "carbon-nmr",
      name: "13C NMR",
      evidenceType: "Carbon framework support",
      strengths: ["Carbonyl, aromatic and heteroatom-adjacent carbons are informative", "Symmetry can reduce signal count", "Complements proton evidence"],
      limitations: ["Usually less sensitive than 1H NMR", "Signal intensity is not directly quantitative in routine spectra", "Overlapping carbonyl classes need context"]
    },
    {
      id: "ms",
      name: "Mass spectrometry",
      evidenceType: "Mass and isotope evidence",
      strengths: ["Molecular ion and isotope patterns constrain formula", "Fragmentation can support substructures", "Halogen patterns are high-value clues"],
      limitations: ["Molecular ion may be weak or absent", "Fragment assignment can be ambiguous", "Isomers may share the same formula"]
    }
  ],
  uncertaintyRules: [
    "Prefer converging evidence from independent techniques.",
    "Do not let one diagnostic signal erase conflicting observations.",
    "Record the distinction between observed signal, interpretation and structural claim.",
    "Escalate confidence only when missing metadata and artefact risks are addressed."
  ]
};
