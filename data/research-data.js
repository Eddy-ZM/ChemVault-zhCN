window.CHEMVAULT_RESEARCH = {
  caseStudies: [
    {
      id: "unknown-carbonyl",
      title: "Unknown carbonyl assignment",
      discipline: "Spectroscopy and organic structure",
      question: "Does the evidence support assigning the unknown as an aldehyde rather than a ketone?",
      thesis: "The combined IR, 1H NMR and 13C NMR pattern supports an aldehyde assignment, with the strongest single observation being the downfield 1H signal near 9.8 ppm.",
      confidence: 88,
      sourceRefs: ["iupac-beer", "nist-webbook", "iupac-goldbook"],
      observations: [
        {
          type: "IR",
          level: "A",
          observation: "Strong absorption at 1718 cm-1.",
          inference: "Consistent with a carbonyl functional group.",
          limitation: "The band alone does not distinguish aldehyde from ketone, ester or acid."
        },
        {
          type: "1H NMR",
          level: "A",
          observation: "One-proton resonance at delta 9.8 ppm.",
          inference: "Strong evidence for an aldehydic proton.",
          limitation: "Confirm integration and rule out impurity or solvent artefact."
        },
        {
          type: "13C NMR",
          level: "A",
          observation: "Carbon signal near delta 200 ppm.",
          inference: "Consistent with aldehyde or ketone carbonyl carbon.",
          limitation: "Requires correlation with proton NMR for aldehyde-specific assignment."
        },
        {
          type: "Method",
          level: "C",
          observation: "Assignment uses converging spectral evidence rather than one diagnostic peak.",
          inference: "The claim has stronger academic defensibility.",
          limitation: "Reference spectra or authentic sample comparison would increase confidence."
        }
      ],
      argument: {
        claim: "The unknown contains an aldehyde carbonyl.",
        warrant: "Aldehydes commonly show both a carbonyl signal and a distinctive downfield proton resonance; a ketone would lack the aldehydic 1H signal.",
        counter: "A single IR carbonyl absorption is insufficient because many carbonyl derivatives absorb in similar regions.",
        nextTest: "Acquire 2D NMR or compare against a reference spectrum from an evaluated database."
      },
      report: {
        aim: "Assign the most plausible carbonyl class from the available spectral data.",
        method: "Compare observed IR, 1H NMR and 13C NMR features against curated reference ranges and record limitations.",
        conclusion: "The spectral pattern supports aldehyde assignment, with the aldehydic proton providing the discriminating evidence.",
        limitations: "No authentic sample comparison, no 2D NMR, and no purity assessment are included in this static case file."
      }
    },
    {
      id: "reduction-selectivity",
      title: "Hydride selectivity audit",
      discipline: "Synthetic planning",
      question: "Which reducing agent is academically defensible for reducing an aldehyde in the presence of an ester?",
      thesis: "NaBH4 is the better first proposal when selective aldehyde or ketone reduction is desired, while LiAlH4 is too broad for an ester-containing substrate without protecting-group strategy.",
      confidence: 82,
      sourceRefs: ["orgsyn", "iupac-goldbook", "acs-green"],
      observations: [
        {
          type: "Reagent scope",
          level: "D",
          observation: "NaBH4 is commonly treated as a milder hydride donor in teaching-lab selectivity problems.",
          inference: "It is a plausible selective reagent for aldehyde or ketone reduction.",
          limitation: "Actual chemoselectivity depends on substrate, solvent, temperature and work-up."
        },
        {
          type: "Reagent scope",
          level: "D",
          observation: "LiAlH4 can reduce esters and carboxylic acids under dry conditions.",
          inference: "It risks reducing the ester functionality.",
          limitation: "Procedure-specific evidence should be checked before final synthesis planning."
        },
        {
          type: "Sustainability",
          level: "D",
          observation: "A milder, more selective reagent can reduce downstream purification and waste.",
          inference: "Selectivity is not only a yield question; it affects green chemistry metrics.",
          limitation: "A real green metric requires mass, solvent and waste accounting."
        }
      ],
      argument: {
        claim: "NaBH4 is the preferred initial reagent for selective carbonyl reduction in this scenario.",
        warrant: "A narrower functional-group scope is better aligned with preserving the ester functionality.",
        counter: "If the aldehyde is unusually hindered or deactivated, the mild reagent may be insufficient.",
        nextTest: "Check a substrate-specific procedure and run a small-scale monitored reaction if institutionally approved."
      },
      report: {
        aim: "Select a reducing agent that maximizes chemoselectivity and minimizes avoidable functional-group damage.",
        method: "Compare reagent scope, compatibility and academic evidence level before choosing reaction conditions.",
        conclusion: "NaBH4 is the defensible first proposal; LiAlH4 should be reserved for broader reductions or different targets.",
        limitations: "This is a planning argument, not a validated experimental procedure."
      }
    },
    {
      id: "aromatic-bromination",
      title: "Aromatic bromination mechanism audit",
      discipline: "Mechanistic organic chemistry",
      question: "Why is a Lewis acid catalyst included for benzene bromination?",
      thesis: "The Lewis acid increases electrophile strength, allowing substitution while preserving aromaticity after deprotonation.",
      confidence: 80,
      sourceRefs: ["iupac-electrophile", "iupac-goldbook", "orgsyn"],
      observations: [
        {
          type: "Mechanism",
          level: "C",
          observation: "Benzene is stabilized by aromaticity.",
          inference: "Direct addition is disfavoured because it disrupts aromatic stabilization.",
          limitation: "Aromaticity is a model with several criteria, not a single measured value."
        },
        {
          type: "Mechanism",
          level: "C",
          observation: "FeBr3 or AlBr3 polarizes Br2.",
          inference: "A stronger electrophilic brominating species is generated.",
          limitation: "The exact reactive species depends on conditions."
        },
        {
          type: "Mechanism",
          level: "C",
          observation: "Final deprotonation restores aromaticity.",
          inference: "Substitution is favoured over permanent addition.",
          limitation: "Substituted rings require directing-effect analysis."
        }
      ],
      argument: {
        claim: "The Lewis acid is required to generate a sufficiently reactive electrophile for electrophilic aromatic substitution.",
        warrant: "Benzene's delocalized system is stable, so bromine must be activated before the ring attacks.",
        counter: "Highly activated aromatic rings may brominate under milder conditions than benzene.",
        nextTest: "Compare reaction rate or product distribution across activated and deactivated aromatic substrates."
      },
      report: {
        aim: "Explain the catalytic role in benzene bromination using electrophile strength and aromaticity.",
        method: "Map each step to an evidence statement: electrophile generation, sigma complex formation and rearomatization.",
        conclusion: "The catalyst enables electrophilic substitution by activating bromine while the mechanism ultimately restores aromaticity.",
        limitations: "This is a mechanistic explanation and not a full kinetic or computational study."
      }
    },
    {
      id: "green-route",
      title: "Green metric route comparison",
      discipline: "Sustainability and lab reporting",
      question: "How should a route be evaluated when yield and hazard point in different directions?",
      thesis: "A more academic comparison reports yield, selectivity, waste boundary and hazard rather than ranking routes by percentage yield alone.",
      confidence: 76,
      sourceRefs: ["acs-green", "orgsyn", "pubchem"],
      observations: [
        {
          type: "Metric",
          level: "D",
          observation: "Yield measures desired product relative to theoretical amount.",
          inference: "Yield does not account for solvent, auxiliary reagents or purification burden.",
          limitation: "Yield remains important, but it is incomplete."
        },
        {
          type: "Metric",
          level: "D",
          observation: "E-factor considers waste mass relative to product mass.",
          inference: "A lower E-factor can identify a cleaner route even when yields are similar.",
          limitation: "Boundary definitions must be stated."
        },
        {
          type: "Hazard",
          level: "D",
          observation: "Hazardous reagents and solvents change the risk profile.",
          inference: "Academic route choice should include safety and sustainability language.",
          limitation: "Full assessment requires SDS and institutional controls."
        }
      ],
      argument: {
        claim: "Route evaluation should combine yield, selectivity, hazard and waste metrics.",
        warrant: "A single percentage yield can hide poor atom economy, hazardous conditions or heavy purification waste.",
        counter: "At discovery scale, data may be incomplete; report assumptions instead of overclaiming.",
        nextTest: "Calculate yield, atom economy and E-factor with clearly defined mass boundaries."
      },
      report: {
        aim: "Compare routes using a defensible sustainability framework.",
        method: "State yield, waste boundary, hazardous inputs, purification burden and evidence level for each claim.",
        conclusion: "The academically stronger route argument is multi-criterion, not yield-only.",
        limitations: "The static example does not include full inventory masses or SDS-specific hazard coding."
      }
    }
  ],
  checklist: [
    "Claim is stated as a testable chemical assertion.",
    "Evidence type and evidence level are recorded.",
    "At least one limitation or counterargument is included.",
    "Terminology is consistent with IUPAC-style usage where relevant.",
    "Numerical claims include units and context.",
    "Sources are linked to the claim rather than listed as decoration."
  ]
};
