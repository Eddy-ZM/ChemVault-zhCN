(() => {
  const data = window.CHEMVAULT_DATA || (window.CHEMVAULT_DATA = {});
  const materialData = window.CHEMVAULT_MATERIALS || (window.CHEMVAULT_MATERIALS = { materials: [], propertyAxes: [], characterizationMethods: [] });

  data.reagents = data.reagents || [];
  data.compounds = data.compounds || [];
  data.routes = data.routes || [];
  data.mechanisms = data.mechanisms || [];
  data.concepts = data.concepts || [];
  data.reactants = data.reactants || [];
  data.reactionSystems = data.reactionSystems || [];
  materialData.materials = materialData.materials || [];
  materialData.propertyAxes = materialData.propertyAxes || [];
  materialData.characterizationMethods = materialData.characterizationMethods || [];

  function addUnique(list, items) {
    const known = new Set(list.map((item) => item.id));
    items.forEach((item) => {
      if (!known.has(item.id)) {
        list.push(item);
        known.add(item.id);
      }
    });
  }

  function addTerms(list, terms) {
    const known = new Set(list);
    terms.forEach((term) => {
      if (!known.has(term)) {
        list.push(term);
        known.add(term);
      }
    });
  }

  addUnique(data.reactants, [
    {
      id: "aryl-halide-electrophile",
      name: "Aryl halide electrophile",
      className: "Cross-coupling substrate",
      functionalGroups: ["C(sp2)-Br", "C(sp2)-I", "C(sp2)-Cl", "heteroaryl halide"],
      compatibleMethods: ["Suzuki-Miyaura coupling", "Buchwald-Hartwig amination", "Sonogashira coupling", "Heck reaction"],
      evidence: ["GC-MS or LC-MS consumption", "NMR assignment of biaryl or aryl amine product", "Control for protodehalogenation"],
      constraints: ["Aryl chlorides usually require more active catalysts", "Basic heterocycles can poison catalysts", "Steric hindrance slows oxidative addition"]
    },
    {
      id: "boronic-acid-partner",
      name: "Aryl or vinyl boronic acid",
      className: "Organoboron nucleophile",
      functionalGroups: ["B(OH)2", "boronate ester", "MIDA boronate"],
      compatibleMethods: ["Suzuki-Miyaura coupling", "Chan-Lam coupling", "Conjugate addition"],
      evidence: ["Boron partner identity", "Base and water fraction", "Homocoupling impurity audit"],
      constraints: ["Protodeboronation can dominate electron-poor heteroaryl systems", "Water and base change transmetalation rate"]
    },
    {
      id: "terminal-alkyne",
      name: "Terminal alkyne",
      className: "C(sp) nucleophile",
      functionalGroups: ["C=CH", "protected alkyne", "silyl alkyne"],
      compatibleMethods: ["Sonogashira coupling", "CuAAC click chemistry", "Hydroboration-oxidation"],
      evidence: ["Alkyne proton disappearance", "IR C-H stretch near terminal alkyne region", "Glaser homocoupling check"],
      constraints: ["Copper and oxygen can generate diyne byproducts", "Strong base can affect sensitive groups"]
    },
    {
      id: "alkene-feedstock",
      name: "Alkene feedstock",
      className: "Unsaturated substrate",
      functionalGroups: ["terminal alkene", "internal alkene", "styrenyl alkene", "enone"],
      compatibleMethods: ["Hydroboration-oxidation", "Epoxidation", "Heck reaction", "Olefin metathesis"],
      evidence: ["Regiochemistry assignment", "Alkene geometry before reaction", "Residual alkene NMR integration"],
      constraints: ["Electronic bias controls regioselectivity", "E/Z mixtures complicate stereochemical claims"]
    },
    {
      id: "aldehyde-ketone-carbonyl",
      name: "Aldehyde or ketone",
      className: "Carbonyl electrophile",
      functionalGroups: ["aldehyde", "ketone", "enone", "imino carbonyl equivalent"],
      compatibleMethods: ["Hydride reduction", "Grignard addition", "Reductive amination", "Aldol chemistry", "Wittig olefination"],
      evidence: ["Carbonyl IR and NMR changes", "Chemoselectivity against ester or amide groups", "Stereochemical outcome if chiral"],
      constraints: ["Aldehydes are more reactive than ketones", "Enolizable carbonyls need base and temperature control"]
    },
    {
      id: "carboxylic-acid-platform",
      name: "Carboxylic acid platform",
      className: "Acyl precursor",
      functionalGroups: ["CO2H", "acid chloride", "activated ester", "anhydride"],
      compatibleMethods: ["Amide coupling", "Esterification", "Acid chloride formation", "Polycondensation"],
      evidence: ["Activation intermediate or coupling conversion", "Residual acid titration or LC trace", "Racemization check for chiral acids"],
      constraints: ["Water competes with activation", "Base and coupling reagent choice changes byproduct profile"]
    },
    {
      id: "amine-nucleophile",
      name: "Amine nucleophile",
      className: "Nitrogen nucleophile",
      functionalGroups: ["primary amine", "secondary amine", "aniline", "heteroaryl amine"],
      compatibleMethods: ["Buchwald-Hartwig amination", "Reductive amination", "Amide coupling", "Sulfonamide formation"],
      evidence: ["Free-base or salt state", "N-alkylation versus acylation selectivity", "Residual coupling reagent removal"],
      constraints: ["Anilines are weaker nucleophiles than alkyl amines", "Steric and basicity effects control conversion"]
    },
    {
      id: "alcohol-polyol",
      name: "Alcohol or polyol",
      className: "Oxygen nucleophile and leaving-group precursor",
      functionalGroups: ["primary alcohol", "secondary alcohol", "diol", "phenol"],
      compatibleMethods: ["Oxidation", "Esterification", "Tosylation", "Sol-gel surface grafting", "Polyurethane formation"],
      evidence: ["Oxidation state assignment", "Moisture content", "Selective protection record for polyols"],
      constraints: ["Primary and secondary alcohols diverge under oxidation", "Phenols are more acidic and less SN2-like"]
    },
    {
      id: "epoxide-strained-ring",
      name: "Epoxide",
      className: "Strained electrophile",
      functionalGroups: ["oxirane", "glycidyl ether", "epoxy resin precursor"],
      compatibleMethods: ["Ring-opening polymerization", "Amine curing", "Nucleophilic ring opening", "Surface functionalization"],
      evidence: ["Epoxide equivalent weight", "Ring-opening regioselectivity", "Residual epoxide signal"],
      constraints: ["Acidic and basic conditions invert regioselectivity trends", "Water and amines can compete strongly"]
    },
    {
      id: "diene-dienophile-pair",
      name: "Diene and dienophile pair",
      className: "Pericyclic partners",
      functionalGroups: ["conjugated diene", "electron-poor alkene", "maleimide", "furan"],
      compatibleMethods: ["Diels-Alder cycloaddition", "Retro-Diels-Alder", "Polymer network curing"],
      evidence: ["Endo/exo ratio", "Stereospecificity", "Thermal reversibility if furan-maleimide"],
      constraints: ["Diene conformation controls rate", "Temperature can change kinetic versus thermodynamic product ratios"]
    },
    {
      id: "azide-alkyne-pair",
      name: "Organic azide and alkyne pair",
      className: "Click chemistry partners",
      functionalGroups: ["organic azide", "terminal alkyne", "triazole product"],
      compatibleMethods: ["CuAAC click chemistry", "SPAAC bioconjugation", "Surface immobilization"],
      evidence: ["Azide IR loss", "Triazole NMR assignment", "Copper residue assessment for biological use"],
      constraints: ["Copper compatibility matters in biomolecular systems", "Strain-promoted variants avoid copper but alter kinetics"]
    },
    {
      id: "isocyanate-polyol",
      name: "Isocyanate and polyol",
      className: "Polyurethane partners",
      functionalGroups: ["NCO", "polyether polyol", "polyester polyol", "urethane"],
      compatibleMethods: ["Step-growth polymerization", "Foam formation", "Elastomer curing"],
      evidence: ["NCO index", "FTIR NCO band decay", "Gel fraction and mechanical profile"],
      constraints: ["Water generates CO2 and urea linkages", "Catalyst changes pot life and network topology"]
    },
    {
      id: "metal-salt-precursor",
      name: "Metal salt precursor",
      className: "Inorganic precursor",
      functionalGroups: ["nitrate", "acetate", "chloride", "alkoxide", "metal complex"],
      compatibleMethods: ["Sol-gel synthesis", "Co-precipitation", "MOF synthesis", "Nanoparticle reduction"],
      evidence: ["Counter-ion identity", "Hydrolysis ratio", "Phase and oxidation-state characterization"],
      constraints: ["pH and ligand field control nucleation", "Residual anions can change material performance"]
    },
    {
      id: "silane-coupling-agent",
      name: "Silane coupling agent",
      className: "Surface modifier",
      functionalGroups: ["trialkoxysilane", "chlorosilane", "aminosilane", "methacrylate silane"],
      compatibleMethods: ["Surface silanization", "Sol-gel coating", "Composite interface design"],
      evidence: ["Contact angle or XPS surface change", "Hydrolysis and condensation conditions", "Unbound silane washing record"],
      constraints: ["Moisture is required but excess water causes oligomerization", "Surface hydroxyl density controls coverage"]
    },
    {
      id: "biomass-oxygenate",
      name: "Biomass oxygenate",
      className: "Renewable platform molecule",
      functionalGroups: ["furfural", "levulinic acid", "lactic acid", "cellulose", "lignin"],
      compatibleMethods: ["Hydrogenation", "Oxidation", "Esterification", "Catalytic upgrading"],
      evidence: ["Feedstock purity", "Mass balance", "Catalyst recyclability and carbon efficiency"],
      constraints: ["Mixtures and water content complicate kinetics", "Humins or char can mask catalyst deactivation"]
    }
  ]);

  addUnique(data.reactionSystems, [
    {
      id: "suzuki-miyaura-platform",
      name: "Suzuki-Miyaura cross-coupling",
      className: "Pd-catalyzed C-C bond formation",
      domain: "Organic synthesis",
      maturity: 94,
      substrates: ["aryl-halide-electrophile", "boronic-acid-partner"],
      reagents: ["palladium-acetate", "suzuki-base"],
      mechanisms: ["oxidative-addition-cycle", "transmetalation-gate", "reductive-elimination-cycle"],
      conditions: ["Pd catalyst and ligand system", "carbonate, phosphate or hydroxide base", "aqueous organic solvent frequently used"],
      readouts: ["Biaryl LC-MS", "halide conversion", "boronic acid homocoupling level"],
      limitations: ["Protodeboronation", "dehalogenation", "heteroaryl catalyst poisoning"],
      nextQuestions: ["Is the aryl chloride activated enough?", "Does base destroy the boronic acid?", "Is air or water beneficial for this ligand system?"]
    },
    {
      id: "buchwald-hartwig-amination",
      name: "Buchwald-Hartwig amination",
      className: "Pd-catalyzed C-N bond formation",
      domain: "Organic synthesis",
      maturity: 90,
      substrates: ["aryl-halide-electrophile", "amine-nucleophile"],
      reagents: ["palladium-acetate", "xphos", "kotbu"],
      mechanisms: ["oxidative-addition-cycle", "reductive-elimination-cycle"],
      conditions: ["Bulky electron-rich phosphine ligand", "strong base", "dry degassed solvent in many protocols"],
      readouts: ["Aryl amine product identity", "mono versus diarylation selectivity", "residual aryl halide"],
      limitations: ["Base-sensitive substrates", "amine coordination", "aryl chloride activation"],
      nextQuestions: ["Should a milder base be screened?", "Is monoarylation or diarylation desired?", "Does the amine salt need free-basing?"]
    },
    {
      id: "sonogashira-platform",
      name: "Sonogashira coupling",
      className: "Pd/Cu C(sp2)-C(sp) coupling",
      domain: "Organic synthesis",
      maturity: 88,
      substrates: ["aryl-halide-electrophile", "terminal-alkyne"],
      reagents: ["palladium-acetate", "cui", "triethylamine"],
      mechanisms: ["oxidative-addition-cycle", "transmetalation-gate", "reductive-elimination-cycle"],
      conditions: ["Pd catalyst", "amine base", "copper co-catalyst or copper-free variant"],
      readouts: ["Alkynyl arene mass", "terminal alkyne disappearance", "diyne impurity audit"],
      limitations: ["Glaser coupling", "base-sensitive alkynes", "copper contamination"],
      nextQuestions: ["Is oxygen excluded?", "Can copper-free conditions reduce homocoupling?", "Is the alkyne protected?"]
    },
    {
      id: "heck-olefination",
      name: "Mizoroki-Heck olefination",
      className: "Pd-catalyzed arylation of alkenes",
      domain: "Organic synthesis",
      maturity: 86,
      substrates: ["aryl-halide-electrophile", "alkene-feedstock"],
      reagents: ["palladium-acetate", "triethylamine"],
      mechanisms: ["oxidative-addition-cycle", "migratory-insertion", "beta-hydride-elimination"],
      conditions: ["Base", "polar aprotic solvent", "ligand and temperature matched to halide"],
      readouts: ["E/Z alkene ratio", "regiochemistry", "aryl halide conversion"],
      limitations: ["Double-bond isomerization", "beta-hydride pathways", "reduction side products"],
      nextQuestions: ["Which alkene regioisomer is expected?", "Can beta-hydride elimination be controlled?", "Does the substrate tolerate high temperature?"]
    },
    {
      id: "amide-coupling-platform",
      name: "Amide coupling workflow",
      className: "Acyl activation and nucleophilic substitution",
      domain: "Medicinal chemistry",
      maturity: 92,
      substrates: ["carboxylic-acid-platform", "amine-nucleophile"],
      reagents: ["edc", "hobt", "cdi"],
      mechanisms: ["acyl-substitution", "activation-leaving-group"],
      conditions: ["carbodiimide, uronium or imidazolide activation", "base matched to amine salt", "water exclusion when needed"],
      readouts: ["amide carbonyl", "residual acid", "urea byproduct removal"],
      limitations: ["Racemization", "low nucleophilicity anilines", "difficult purification"],
      nextQuestions: ["Is stereochemical integrity preserved?", "Would CDI or acid chloride be cleaner?", "Which byproduct co-elutes?"]
    },
    {
      id: "reductive-amination-platform",
      name: "Reductive amination",
      className: "C-N bond formation through imine chemistry",
      domain: "Organic synthesis",
      maturity: 88,
      substrates: ["aldehyde-ketone-carbonyl", "amine-nucleophile"],
      reagents: ["sodium-cyanoborohydride", "sodium-triacetoxyborohydride"],
      mechanisms: ["imine-ion-pair", "hydride-transfer"],
      conditions: ["mild acid buffer", "imine or iminium formation", "chemoselective hydride donor"],
      readouts: ["imine disappearance", "amine product mass", "carbonyl carryover"],
      limitations: ["Overalkylation", "ketone sluggishness", "cyanide risk for NaBH3CN"],
      nextQuestions: ["Is water removal needed?", "Would preformed imine help?", "Can carbonyl reduction compete?"]
    },
    {
      id: "wittig-hwe-olefination",
      name: "Wittig and HWE olefination",
      className: "Carbonyl-to-alkene conversion",
      domain: "Organic synthesis",
      maturity: 86,
      substrates: ["aldehyde-ketone-carbonyl"],
      reagents: ["wittig-ylide", "hwe-phosphonate"],
      mechanisms: ["betaine-oxaphosphetane", "anion-stabilization"],
      conditions: ["ylide or phosphonate base generation", "temperature and counter-ion control", "aldehyde usually more reactive than ketone"],
      readouts: ["E/Z ratio", "triphenylphosphine oxide removal", "residual carbonyl"],
      limitations: ["Stereochemical mixtures", "basic conditions", "phosphorus byproducts"],
      nextQuestions: ["Is E-selectivity required?", "Can HWE simplify purification?", "Does the carbonyl enolize?"]
    },
    {
      id: "aldol-michael-annulation",
      name: "Aldol-Michael annulation logic",
      className: "Enolate and conjugate addition network",
      domain: "Organic synthesis",
      maturity: 84,
      substrates: ["aldehyde-ketone-carbonyl", "alkene-feedstock"],
      reagents: ["lda", "proline", "dbu"],
      mechanisms: ["enolate-addition", "enamine-organocatalysis", "conjugate-addition"],
      conditions: ["base or organocatalyst", "temperature-controlled enolate formation", "acceptor electrophilicity"],
      readouts: ["diastereomer ratio", "dehydration product", "1,2 versus 1,4 addition"],
      limitations: ["Self-condensation", "E/Z enolate control", "polymerization of acceptors"],
      nextQuestions: ["Kinetic or thermodynamic enolate?", "Is water removal needed?", "Which stereochemical model is defensible?"]
    },
    {
      id: "grignard-carbonyl-addition",
      name: "Grignard carbonyl addition",
      className: "Organomagnesium nucleophilic addition",
      domain: "Organic synthesis",
      maturity: 88,
      substrates: ["aldehyde-ketone-carbonyl", "carboxylic-acid-platform"],
      reagents: ["grignard", "dry-ether"],
      mechanisms: ["organometallic-addition", "acid-base-quench"],
      conditions: ["dry ether", "slow electrophile addition", "acidic work-up"],
      readouts: ["alcohol product", "protonation byproduct", "magnesium salt work-up"],
      limitations: ["Moisture intolerance", "acidic protons quench reagent", "overaddition to esters"],
      nextQuestions: ["Which functional groups must be protected?", "Is cerium modification needed?", "Is the Grignard reagent titrated?"]
    },
    {
      id: "diels-alder-platform",
      name: "Diels-Alder cycloaddition",
      className: "Concerted pericyclic reaction",
      domain: "Organic synthesis",
      maturity: 87,
      substrates: ["diene-dienophile-pair"],
      reagents: ["lewis-acid", "maleic-anhydride"],
      mechanisms: ["pericyclic-cycloaddition"],
      conditions: ["thermal or Lewis acid promoted", "diene conformation control", "electron-rich diene and electron-poor dienophile"],
      readouts: ["endo/exo selectivity", "stereospecific product", "retro-reaction check"],
      limitations: ["Reversibility", "diene polymerization", "regioisomer mixtures"],
      nextQuestions: ["Is endo selectivity kinetic?", "Does temperature trigger retro-Diels-Alder?", "Can frontier orbital arguments explain regioselectivity?"]
    },
    {
      id: "olefin-metathesis-platform",
      name: "Olefin metathesis",
      className: "Metal carbene alkene exchange",
      domain: "Organic synthesis",
      maturity: 84,
      substrates: ["alkene-feedstock"],
      reagents: ["grubbs-catalyst", "hoveyda-grubbs"],
      mechanisms: ["metallacyclobutane-cycle"],
      conditions: ["Ru carbene catalyst", "ethylene removal for RCM/CM when useful", "functional-group-compatible solvent"],
      readouts: ["alkene isomer distribution", "ring-closing conversion", "ruthenium removal"],
      limitations: ["E/Z mixtures", "catalyst decomposition", "coordinating heteroatoms"],
      nextQuestions: ["Is ring strain favorable?", "Should ethylene be removed?", "Does substrate chelation shut down catalysis?"]
    },
    {
      id: "cuaac-click-platform",
      name: "CuAAC click chemistry",
      className: "Azide-alkyne cycloaddition",
      domain: "Bioconjugation",
      maturity: 91,
      substrates: ["azide-alkyne-pair", "terminal-alkyne"],
      reagents: ["cuso4-sodium-ascorbate", "tbta"],
      mechanisms: ["copper-acetylide-cycle"],
      conditions: ["Cu(I) generation", "ligand or stabilizer", "aqueous-organic mixture when needed"],
      readouts: ["1,4-triazole product", "azide IR loss", "copper residue"],
      limitations: ["Copper toxicity for bio-use", "azide safety", "alkyne homocoupling"],
      nextQuestions: ["Is copper compatible with the substrate?", "Would SPAAC be better?", "Is oxygen excluded or tolerated?"]
    },
    {
      id: "sharpless-epoxidation",
      name: "Sharpless asymmetric epoxidation",
      className: "Asymmetric oxidation",
      domain: "Stereoselective synthesis",
      maturity: 86,
      substrates: ["alkene-feedstock"],
      reagents: ["titanium-isopropoxide", "diethyl-tartrate", "tbhp"],
      mechanisms: ["chiral-metal-oxygen-transfer"],
      conditions: ["allylic alcohol substrate", "tartrate ligand", "anhydrous oxidant system"],
      readouts: ["epoxide enantiomeric excess", "allylic alcohol conversion", "diastereomer ratio"],
      limitations: ["Requires allylic alcohol bias", "water sensitivity", "substrate geometry effects"],
      nextQuestions: ["Which tartrate enantiomer gives desired face selectivity?", "Is the alkene allylic alcohol activated?", "How is ee measured?"]
    },
    {
      id: "swern-dessmartin-oxidation",
      name: "Modern alcohol oxidation panel",
      className: "Chemoselective oxidation",
      domain: "Organic synthesis",
      maturity: 89,
      substrates: ["alcohol-polyol", "aldehyde-ketone-carbonyl"],
      reagents: ["swern-system", "dess-martin-periodinane", "tempo-bleach"],
      mechanisms: ["activated-dmso-elimination", "hypervalent-iodine-oxygen-transfer", "nitroxyl-radical-cycle"],
      conditions: ["low temperature for Swern", "mild neutral DMP conditions", "pH-managed TEMPO oxidation"],
      readouts: ["aldehyde versus acid selectivity", "iodine byproducts", "overoxidation check"],
      limitations: ["odor and gas evolution", "periodinane cost and waste", "pH-dependent selectivity"],
      nextQuestions: ["Is aldehyde isolation required?", "Will acid-sensitive groups survive?", "Which waste stream is acceptable?"]
    },
    {
      id: "sol-gel-network-synthesis",
      name: "Sol-gel network synthesis",
      className: "Hydrolysis-condensation material route",
      domain: "Materials chemistry",
      maturity: 88,
      substrates: ["metal-salt-precursor", "silane-coupling-agent", "alcohol-polyol"],
      reagents: ["tetraethyl-orthosilicate", "titanium-isopropoxide", "ammonia"],
      mechanisms: ["sol-gel-condensation", "surface-silanization"],
      conditions: ["water-to-alkoxide ratio", "acid or base catalysis", "aging and drying protocol"],
      readouts: ["gel time", "BET surface area", "FTIR Si-O or M-O network", "shrinkage on drying"],
      limitations: ["cracking during drying", "uncontrolled hydrolysis", "residual solvent"],
      nextQuestions: ["Is porosity or coating continuity the target?", "Is hydrolysis acid or base catalyzed?", "How is aging documented?"]
    },
    {
      id: "mof-solvothermal-synthesis",
      name: "MOF solvothermal synthesis",
      className: "Coordination-network assembly",
      domain: "Materials chemistry",
      maturity: 84,
      substrates: ["metal-salt-precursor"],
      reagents: ["terephthalic-acid", "2-methylimidazole", "modulator-acetic-acid"],
      mechanisms: ["coordination-assembly", "nucleation-growth"],
      conditions: ["metal-to-linker ratio", "modulator concentration", "activation solvent exchange"],
      readouts: ["PXRD pattern", "BET area after activation", "TGA solvent content", "SEM crystal habit"],
      limitations: ["phase impurity", "blocked pores", "moisture sensitivity"],
      nextQuestions: ["Does PXRD match topology?", "Are pores activated?", "Can modulator defects explain properties?"]
    },
    {
      id: "atrp-polymerization",
      name: "ATRP controlled radical polymerization",
      className: "Reversible deactivation radical polymerization",
      domain: "Polymer chemistry",
      maturity: 86,
      substrates: ["alkene-feedstock"],
      reagents: ["ethyl-alpha-bromoisobutyrate", "cubr", "bipyridine"],
      mechanisms: ["atrp-activation-deactivation"],
      conditions: ["alkyl halide initiator", "Cu catalyst and ligand", "oxygen management"],
      readouts: ["number-average molecular weight", "dispersity", "monomer conversion", "chain-end fidelity"],
      limitations: ["oxygen inhibition", "copper residue", "slow monomers"],
      nextQuestions: ["Is linear growth observed?", "Does dispersity stay low?", "Can the chain end be reinitiated?"]
    },
    {
      id: "raft-polymerization",
      name: "RAFT polymerization",
      className: "Reversible addition-fragmentation chain transfer",
      domain: "Polymer chemistry",
      maturity: 87,
      substrates: ["alkene-feedstock"],
      reagents: ["raft-agent", "aibn"],
      mechanisms: ["raft-addition-fragmentation"],
      conditions: ["RAFT agent matched to monomer", "radical initiator", "controlled conversion window"],
      readouts: ["molecular weight evolution", "dispersity", "CTA end-group evidence"],
      limitations: ["colored or odorous end groups", "monomer class mismatch", "thermal degradation"],
      nextQuestions: ["Is CTA Z/R group matched?", "Is conversion high enough but controlled?", "Can end-group removal be documented?"]
    },
    {
      id: "polyurethane-curing",
      name: "Polyurethane curing system",
      className: "Step-growth network formation",
      domain: "Polymer and materials chemistry",
      maturity: 85,
      substrates: ["isocyanate-polyol", "alcohol-polyol"],
      reagents: ["dibutyltin-dilaurate", "mdi", "tdi"],
      mechanisms: ["urethane-formation", "network-gelation"],
      conditions: ["NCO/OH ratio", "moisture control", "catalyst loading and pot life"],
      readouts: ["FTIR NCO decay", "gel fraction", "DMA modulus", "tensile profile"],
      limitations: ["water side reaction", "phase separation", "isocyanate safety"],
      nextQuestions: ["Is stoichiometry balanced?", "Does humidity change foam density?", "Is curing diffusion-limited?"]
    },
    {
      id: "biomass-upgrading",
      name: "Biomass platform upgrading",
      className: "Catalytic conversion network",
      domain: "Green chemistry",
      maturity: 80,
      substrates: ["biomass-oxygenate", "aldehyde-ketone-carbonyl", "carboxylic-acid-platform"],
      reagents: ["raney-nickel", "tempo-bleach", "acid-resin"],
      mechanisms: ["hydrogenation-surface-cycle", "acid-catalyzed-dehydration", "oxidation-state-control"],
      conditions: ["aqueous or biphasic solvent", "heterogeneous catalyst", "mass-balance audit"],
      readouts: ["carbon yield", "selectivity", "catalyst recyclability", "humins or coke level"],
      limitations: ["feedstock impurity", "water effects", "catalyst deactivation"],
      nextQuestions: ["Is carbon balance closed?", "Which solvent is truly green?", "Can catalyst reuse be proven?"]
    }
  ]);

  addUnique(data.compounds, [
    {
      id: "phenylboronic-acid",
      name: "Phenylboronic acid",
      formula: "C6H7BO2",
      cas: "98-80-6",
      family: "Organoboron compound",
      synonyms: ["benzeneboronic acid"],
      summary: "A common Suzuki-Miyaura partner and model organoboron reagent for discussing transmetalation and protodeboronation.",
      evidenceNote: "State free acid versus ester form and water/base conditions before comparing reactivity.",
      tags: ["boronic acid", "cross-coupling", "organoboron"]
    },
    {
      id: "bromobenzene",
      name: "Bromobenzene",
      formula: "C6H5Br",
      cas: "108-86-1",
      family: "Aryl halide",
      synonyms: ["phenyl bromide"],
      summary: "Benchmark aryl bromide for oxidative addition, Grignard formation and electrophilic aromatic substitution comparisons.",
      evidenceNote: "Conversion claims should distinguish coupling, dehalogenation and homocoupling products.",
      tags: ["aryl halide", "cross-coupling", "Grignard"]
    },
    {
      id: "iodobenzene",
      name: "Iodobenzene",
      formula: "C6H5I",
      cas: "591-50-4",
      family: "Aryl halide",
      synonyms: ["phenyl iodide"],
      summary: "Highly reactive aryl halide partner in oxidative addition and hypervalent iodine chemistry contexts.",
      evidenceNote: "Iodoarene impurities and photochemical history can affect reactions.",
      tags: ["aryl iodide", "oxidative addition", "iodine"]
    },
    {
      id: "chlorobenzene",
      name: "Chlorobenzene",
      formula: "C6H5Cl",
      cas: "108-90-7",
      family: "Aryl halide",
      synonyms: ["phenyl chloride"],
      summary: "Less reactive aryl chloride model for catalyst and ligand strength in cross-coupling.",
      evidenceNote: "Successful C-Cl activation requires explicit catalyst/ligand context.",
      tags: ["aryl chloride", "cross-coupling", "activation"]
    },
    {
      id: "maleic-anhydride",
      name: "Maleic anhydride",
      formula: "C4H2O3",
      cas: "108-31-6",
      family: "Electron-poor alkene",
      synonyms: ["cis-butenedioic anhydride"],
      summary: "Classic dienophile for Diels-Alder chemistry and reactive compatibilization of polymers.",
      evidenceNote: "Hydrolysis state and isomer purity affect interpretation.",
      tags: ["dienophile", "anhydride", "polymer modifier"]
    },
    {
      id: "furfural",
      name: "Furfural",
      formula: "C5H4O2",
      cas: "98-01-1",
      family: "Biomass aldehyde",
      synonyms: ["furan-2-carbaldehyde"],
      summary: "Renewable platform molecule linking aldehyde chemistry, hydrogenation and furan-based materials.",
      evidenceNote: "Feedstock origin and inhibitor content should be recorded for catalytic studies.",
      tags: ["biomass", "aldehyde", "furan"]
    },
    {
      id: "levulinic-acid",
      name: "Levulinic acid",
      formula: "C5H8O3",
      cas: "123-76-2",
      family: "Biomass keto acid",
      synonyms: ["4-oxopentanoic acid"],
      summary: "Renewable keto acid precursor for gamma-valerolactone and ester fuel-additive chemistry.",
      evidenceNote: "Water content and acid impurities matter in esterification or hydrogenation reports.",
      tags: ["biomass", "keto acid", "green chemistry"]
    },
    {
      id: "lactic-acid",
      name: "Lactic acid",
      formula: "C3H6O3",
      cas: "50-21-5",
      family: "Alpha-hydroxy acid",
      synonyms: ["2-hydroxypropanoic acid"],
      summary: "Chiral platform molecule for esterification and polylactide production.",
      evidenceNote: "Report enantiomeric composition and water content.",
      tags: ["biobased", "polymer", "chiral"]
    },
    {
      id: "caprolactam",
      name: "Caprolactam",
      formula: "C6H11NO",
      cas: "105-60-2",
      family: "Lactam monomer",
      synonyms: ["azepan-2-one"],
      summary: "Cyclic amide monomer used in nylon-6 ring-opening polymerization.",
      evidenceNote: "Moisture and initiator state control polymerization reproducibility.",
      tags: ["monomer", "polyamide", "ring opening"]
    },
    {
      id: "ethylene-carbonate",
      name: "Ethylene carbonate",
      formula: "C3H4O3",
      cas: "96-49-1",
      family: "Cyclic carbonate",
      synonyms: ["1,3-dioxolan-2-one"],
      summary: "Polar cyclic carbonate used in battery electrolyte and carbonate chemistry contexts.",
      evidenceNote: "Battery claims require water content, salt identity and additive package.",
      tags: ["battery", "carbonate", "electrolyte"]
    },
    {
      id: "vinylene-carbonate",
      name: "Vinylene carbonate",
      formula: "C3H2O3",
      cas: "872-36-6",
      family: "Electrolyte additive",
      synonyms: ["1,3-dioxol-2-one"],
      summary: "Common lithium-ion electrolyte additive associated with SEI formation.",
      evidenceNote: "Electrochemical interpretation should include formation protocol and electrode loading.",
      tags: ["battery", "SEI", "additive"]
    },
    {
      id: "dopamine",
      name: "Dopamine",
      formula: "C8H11NO2",
      cas: "51-61-6",
      family: "Catecholamine",
      synonyms: ["3,4-dihydroxyphenethylamine"],
      summary: "Catechol amine used as a biological molecule and as a precursor for polydopamine surface coatings.",
      evidenceNote: "Oxidative polymerization and buffer conditions control coating composition.",
      tags: ["catechol", "surface coating", "biomolecule"]
    },
    {
      id: "benzotriazole",
      name: "Benzotriazole",
      formula: "C6H5N3",
      cas: "95-14-7",
      family: "Heteroaromatic inhibitor",
      synonyms: ["1H-benzotriazole"],
      summary: "Nitrogen heterocycle used in corrosion inhibition and coupling reagent chemistry.",
      evidenceNote: "Surface inhibition claims need metal identity and solution chemistry.",
      tags: ["heterocycle", "corrosion", "coupling"]
    },
    {
      id: "cyclohexanone",
      name: "Cyclohexanone",
      formula: "C6H10O",
      cas: "108-94-1",
      family: "Cyclic ketone",
      synonyms: ["ketohexamethylene"],
      summary: "Model ketone for oxime formation, Baeyer-Villiger oxidation and caprolactam-related chemistry.",
      evidenceNote: "Enol content and oxidation state should be verified in transformation studies.",
      tags: ["ketone", "oxime", "lactam precursor"]
    },
    {
      id: "styrene-oxide",
      name: "Styrene oxide",
      formula: "C8H8O",
      cas: "96-09-3",
      family: "Epoxide",
      synonyms: ["phenyloxirane"],
      summary: "Benzylic epoxide model for regioselective ring opening and polymer or toxicology discussions.",
      evidenceNote: "Regiochemistry and stereochemistry must be assigned rather than inferred from conversion.",
      tags: ["epoxide", "ring opening", "styrene"]
    }
  ]);

  addUnique(data.mechanisms, [
    {
      id: "oxidative-addition-cycle",
      name: "Oxidative addition",
      className: "Organometallic catalysis",
      summary: "A low-valent metal inserts into a sigma bond, commonly raising metal oxidation state and coordination number in cross-coupling cycles.",
      rateLaw: "Often catalyst and aryl halide dependent; ligand electronics and halide identity strongly alter apparent rate.",
      stereo: "Stereochemistry is substrate-specific; oxidative addition to vinyl electrophiles can preserve or alter geometry depending on pathway.",
      bestFor: ["Suzuki-Miyaura coupling", "Buchwald-Hartwig amination", "Heck olefination", "Sonogashira coupling"],
      steps: ["Low-valent metal-ligand complex encounters electrophile", "C-X bond activation forms organometal halide", "Ligand set controls access to later transmetalation or insertion steps"],
      traps: ["Aryl chloride activation may be slow", "Catalyst resting state can be off-cycle", "Ligand oxidation state language must match evidence"],
      tags: ["cross-coupling", "palladium", "nickel"]
    },
    {
      id: "transmetalation-gate",
      name: "Transmetalation gate",
      className: "Organometallic catalysis",
      summary: "Organic group transfer from boron, tin, zinc or copper to a transition metal joins two fragments before reductive elimination.",
      rateLaw: "Base, water and counter-ion terms can dominate apparent kinetics.",
      stereo: "Usually retains organic fragment connectivity; stereochemical claims require product analysis.",
      bestFor: ["Suzuki-Miyaura coupling", "Negishi coupling", "Stille coupling", "Sonogashira coupling"],
      steps: ["Activation of organometal partner", "Ligand exchange at transition metal", "Carbon fragment transfer to metal center"],
      traps: ["Protodeboronation competes", "Counter-ion effects are often hidden", "Water can accelerate or destroy the partner"],
      tags: ["transmetalation", "base", "organoboron"]
    },
    {
      id: "reductive-elimination-cycle",
      name: "Reductive elimination",
      className: "Organometallic catalysis",
      summary: "Two ligands on a metal form a new covalent bond while the metal returns to a lower oxidation state.",
      rateLaw: "Often depends on ligand bite angle, sterics and concentration of active catalytic species.",
      stereo: "Cis ligand arrangement is commonly required; stereochemical transfer depends on ligand geometry.",
      bestFor: ["C-C coupling", "C-N coupling", "C-O coupling", "catalytic cycle closure"],
      steps: ["Reactive ligands become cis", "Bond formation occurs from metal coordination sphere", "Reduced catalyst re-enters cycle"],
      traps: ["Trans ligands may not eliminate", "Product inhibition can slow turnover", "Metal black suggests catalyst death but not mechanism proof"],
      tags: ["cross-coupling", "catalysis", "bond formation"]
    },
    {
      id: "migratory-insertion",
      name: "Migratory insertion",
      className: "Organometallic catalysis",
      summary: "An unsaturated ligand inserts into a metal-carbon or metal-hydride bond, creating a new organometallic intermediate.",
      rateLaw: "Substrate coordination and ligand dissociation frequently appear in kinetic models.",
      stereo: "Syn insertion geometry can govern alkene stereochemistry and regiochemistry.",
      bestFor: ["Heck reaction", "hydroformylation", "polyolefin insertion", "carbonylation"],
      steps: ["Alkene or carbonyl coordinates to metal", "Migrating group forms new bond", "New metal-carbon or metal-acyl intermediate forms"],
      traps: ["Regioisomer mixtures", "beta-hydride elimination follows rapidly", "Coordination sites may be blocked"],
      tags: ["insertion", "Heck", "polymerization"]
    },
    {
      id: "beta-hydride-elimination",
      name: "Beta-hydride elimination",
      className: "Organometallic catalysis",
      summary: "A beta hydrogen transfers to a metal center, forming an alkene and a metal hydride species.",
      rateLaw: "Requires accessible beta C-H bond and suitable metal coordination geometry.",
      stereo: "Syn-coplanar requirements can control alkene geometry.",
      bestFor: ["Heck reaction", "alkene isomerization", "chain transfer", "dehydrogenation"],
      steps: ["Metal alkyl adopts beta-H alignment", "Hydride shifts to metal", "Alkene dissociates or reinserts"],
      traps: ["Unwanted isomerization", "chain walking", "confusing elimination with direct substitution"],
      tags: ["beta hydride", "alkene", "organometallic"]
    },
    {
      id: "acyl-substitution",
      name: "Nucleophilic acyl substitution",
      className: "Carbonyl chemistry",
      summary: "A nucleophile adds to an acyl derivative and the tetrahedral intermediate collapses to expel a leaving group.",
      rateLaw: "Depends on nucleophile strength, leaving-group ability and acid-base conditions.",
      stereo: "Chiral acyl partners can racemize if activation generates enolizable or oxazolone-like intermediates.",
      bestFor: ["amide coupling", "esterification", "acid chloride reactions", "anhydride chemistry"],
      steps: ["Acyl activation or direct nucleophilic attack", "Tetrahedral intermediate formation", "Leaving group expulsion and proton transfer"],
      traps: ["Hydrolysis competes", "overacylation", "racemization of amino acid derivatives"],
      tags: ["amide", "ester", "carbonyl"]
    },
    {
      id: "activation-leaving-group",
      name: "Activation and leaving-group engineering",
      className: "Reaction design",
      summary: "A poor leaving group is converted into a better one so substitution, elimination or coupling becomes kinetically feasible.",
      rateLaw: "Often activation reagent and substrate concentration dependent, followed by nucleophile-dependent capture.",
      stereo: "SN2 capture inverts stereocenters, while cationic pathways can scramble stereochemistry.",
      bestFor: ["tosylation", "acid chloride formation", "imidazolide activation", "carbonate activation"],
      steps: ["Substrate heteroatom attacks activator", "Activated intermediate forms", "Nucleophile captures or leaving group departs"],
      traps: ["Activated intermediate hydrolysis", "neighboring-group participation", "overactivation"],
      tags: ["leaving group", "activation", "substitution"]
    },
    {
      id: "imine-ion-pair",
      name: "Imine and iminium ion chemistry",
      className: "C-N bond formation",
      summary: "Amine and carbonyl condensation creates imine or iminium intermediates that can be reduced or trapped by nucleophiles.",
      rateLaw: "pH has a bell-shaped effect because amine nucleophilicity and carbonyl activation compete.",
      stereo: "Chiral amines, hydride face selectivity and substrate conformation can control stereochemical outcome.",
      bestFor: ["reductive amination", "Mannich reactions", "organocatalysis", "imine ligands"],
      steps: ["Carbinolamine formation", "dehydration to imine or iminium", "hydride transfer or nucleophile addition"],
      traps: ["Water suppresses imine formation", "overalkylation", "direct carbonyl reduction"],
      tags: ["imine", "reductive amination", "pH"]
    },
    {
      id: "hydride-transfer",
      name: "Hydride transfer",
      className: "Reduction",
      summary: "A formal hydride equivalent is delivered to an electrophilic center, often carbonyl carbon or iminium carbon.",
      rateLaw: "Electrophile identity, solvent and Lewis acid activation determine apparent rate.",
      stereo: "Diastereofacial selectivity follows substrate conformation, chelation and reagent architecture.",
      bestFor: ["NaBH4 reduction", "LiAlH4 reduction", "reductive amination", "transfer hydrogenation"],
      steps: ["Electrophile activation or polarization", "hydride delivery", "alkoxide or amine protonation"],
      traps: ["functional-group overreduction", "quench hazards", "borate or aluminum salt work-up artifacts"],
      tags: ["reduction", "carbonyl", "hydride"]
    },
    {
      id: "pericyclic-cycloaddition",
      name: "Pericyclic cycloaddition",
      className: "Concerted orbital reaction",
      summary: "Bond reorganization occurs through a cyclic transition state where orbital symmetry controls feasibility and stereochemical transfer.",
      rateLaw: "Second-order substrate terms are common for bimolecular cycloadditions; Lewis acids can change rate and selectivity.",
      stereo: "Stereospecific; relative alkene geometry is often retained in the product framework.",
      bestFor: ["Diels-Alder reaction", "1,3-dipolar cycloaddition", "electrocyclization comparison"],
      steps: ["Reactive conformations align", "cyclic transition state forms", "sigma bonds form without discrete ions"],
      traps: ["Stepwise radical or ionic alternatives", "thermal reversibility", "incorrect endo/exo assignment"],
      tags: ["pericyclic", "Diels-Alder", "stereochemistry"]
    },
    {
      id: "sol-gel-condensation",
      name: "Sol-gel hydrolysis and condensation",
      className: "Materials chemistry",
      summary: "Metal or silicon alkoxides hydrolyze and condense into M-O-M networks whose porosity and morphology reflect water, catalyst and aging history.",
      rateLaw: "Hydrolysis and condensation have separate pH and water-ratio dependencies.",
      stereo: "Not a molecular stereochemical mechanism; network topology and particle morphology replace molecule-level stereochemistry.",
      bestFor: ["silica gel", "titania", "hybrid coatings", "aerogels"],
      steps: ["alkoxide hydrolysis", "oligomer condensation", "gelation, aging and drying"],
      traps: ["uncontrolled precipitation", "drying cracks", "confusing gel formation with crystallinity"],
      tags: ["sol-gel", "materials", "porosity"]
    },
    {
      id: "surface-silanization",
      name: "Surface silanization",
      className: "Interface chemistry",
      summary: "Hydrolyzed silanes condense with hydroxylated surfaces or with each other, creating functional organic-inorganic interfaces.",
      rateLaw: "Surface hydroxyl density, humidity and silane concentration control apparent coverage.",
      stereo: "Surface orientation and multilayer formation matter more than molecular stereochemistry.",
      bestFor: ["silica modification", "glass functionalization", "composite adhesion", "biosensor immobilization"],
      steps: ["silane hydrolysis", "surface condensation", "curing and removal of physisorbed silane"],
      traps: ["oligomeric silane deposits", "insufficient washing", "overstated monolayer claims"],
      tags: ["surface", "silane", "interface"]
    },
    {
      id: "atrp-activation-deactivation",
      name: "ATRP activation-deactivation equilibrium",
      className: "Polymer mechanism",
      summary: "Dormant alkyl halide chains reversibly form radicals under copper catalysis, limiting radical concentration and controlling chain growth.",
      rateLaw: "Activation, deactivation and propagation terms combine; oxygen removes active Cu(I) catalyst.",
      stereo: "Tacticity is usually not controlled unless monomer and catalyst design impose stereochemical bias.",
      bestFor: ["ATRP", "block copolymers", "surface-initiated polymer brushes", "chain-end fidelity"],
      steps: ["Cu(I) activates alkyl halide", "radical propagates", "Cu(II) deactivates radical back to dormant chain"],
      traps: ["oxygen inhibition", "loss of end-group fidelity", "copper contamination"],
      tags: ["ATRP", "polymer", "radical"]
    },
    {
      id: "raft-addition-fragmentation",
      name: "RAFT addition-fragmentation",
      className: "Polymer mechanism",
      summary: "A thiocarbonylthio chain-transfer agent mediates radical exchange so growing chains experience similar growth histories.",
      rateLaw: "Propagation, addition to CTA and fragmentation rates must be balanced for narrow dispersity.",
      stereo: "RAFT controls molar mass distribution more than stereochemistry.",
      bestFor: ["RAFT polymerization", "block copolymers", "functional polymer end groups", "aqueous radical polymerization"],
      steps: ["radical adds to CTA", "intermediate radical fragments", "new radical propagates and equilibrates"],
      traps: ["wrong CTA for monomer class", "colored end groups", "retardation"],
      tags: ["RAFT", "polymer", "controlled radical"]
    }
  ]);

  addUnique(materialData.materials, [
    {
      id: "uio-66",
      name: "UiO-66",
      family: "Metal-organic frameworks",
      formula: "Zr6O4(OH)4(BDC)6",
      maturity: 84,
      applications: ["Gas adsorption", "Catalyst support", "Defect engineering", "Water-stable MOF benchmark"],
      properties: ["Zr-oxo cluster stability", "Defect-tunable porosity", "High thermal stability", "Linker modification tolerance"],
      synthesis: "Solvothermal assembly of zirconium salts with terephthalate linker, often using acid modulators to control nucleation and defects.",
      characterization: ["PXRD topology", "N2 adsorption", "TGA defect inference", "SEM crystal size", "FTIR linker coordination"],
      limitations: ["Defects must be quantified", "Activation changes accessible porosity", "Residual modulator can affect catalysis"],
      linkedReagents: ["zirconyl-chloride", "terephthalic-acid"],
      evidenceLevel: "A UiO-66 claim needs PXRD plus porosity or defect evidence, not just white powder formation."
    },
    {
      id: "mil-101-cr",
      name: "MIL-101(Cr)",
      family: "Metal-organic frameworks",
      formula: "Cr3O(BDC)3F(H2O)2",
      maturity: 78,
      applications: ["Adsorption", "Catalysis", "Large-pore MOF benchmark", "Composite fillers"],
      properties: ["Large mesoporous cages", "High surface area", "Open metal sites after activation", "Hydrothermal robustness"],
      synthesis: "Hydrothermal chromium-linker assembly followed by extensive washing and activation.",
      characterization: ["PXRD", "BET area", "TGA", "ICP metal content", "SEM morphology"],
      limitations: ["Chromium handling and waste", "Residual linker or acid", "Activation protocol strongly affects surface area"],
      linkedReagents: ["terephthalic-acid"],
      evidenceLevel: "Report washing, activation and porosity before comparing adsorption capacity."
    },
    {
      id: "covalent-organic-framework",
      name: "Imine covalent organic framework",
      family: "Covalent organic frameworks",
      formula: "2D imine-linked network",
      maturity: 76,
      applications: ["Molecular sieving", "Photocatalysis", "Organic electronics", "Adsorbents"],
      properties: ["Crystalline organic porosity", "Pi-stacked layers", "Linkage reversibility", "Tunable pore chemistry"],
      synthesis: "Dynamic covalent condensation between aldehyde and amine nodes under solvothermal or interfacial conditions.",
      characterization: ["PXRD stacking model", "N2 adsorption", "FTIR imine formation", "solid-state NMR", "TEM morphology"],
      limitations: ["Crystallinity can be low", "Stacking disorder", "Residual monomers and amorphous fractions"],
      linkedReagents: ["acetic-acid", "amine-nucleophile"],
      evidenceLevel: "COF assignments require linkage evidence plus crystallinity and porosity."
    },
    {
      id: "mxene-ti3c2tx",
      name: "Ti3C2Tx MXene",
      family: "Two-dimensional carbides",
      formula: "Ti3C2Tx",
      maturity: 78,
      applications: ["Supercapacitors", "Electromagnetic shielding", "Sensors", "Conductive membranes"],
      properties: ["Hydrophilic 2D sheets", "Surface terminations", "High conductivity", "Interlayer ion transport"],
      synthesis: "Selective etching of MAX phase followed by delamination, washing and oxidation management.",
      characterization: ["XRD interlayer shift", "XPS terminations", "SEM/TEM sheet morphology", "conductivity", "zeta potential"],
      limitations: ["Oxidation during storage", "Etchant residue", "Termination composition variability"],
      linkedReagents: ["hf-pyridine", "lithium-fluoride"],
      evidenceLevel: "State etching system, washing endpoint and storage conditions for reproducibility."
    },
    {
      id: "graphitic-carbon-nitride",
      name: "Graphitic carbon nitride",
      family: "Polymeric semiconductors",
      formula: "g-C3N4",
      maturity: 80,
      applications: ["Photocatalysis", "Hydrogen evolution research", "Environmental degradation", "Heterojunctions"],
      properties: ["Visible-light absorption", "Layered polymeric structure", "Nitrogen-rich surface", "Defect tunability"],
      synthesis: "Thermal condensation of melamine, urea or dicyandiamide followed by exfoliation or doping when required.",
      characterization: ["XRD layered peak", "FTIR heptazine bands", "UV-Vis band gap", "photoluminescence", "BET area"],
      limitations: ["Low surface area unless modified", "Recombination of charge carriers", "Precursor history changes performance"],
      linkedReagents: ["melamine"],
      evidenceLevel: "Photocatalysis needs light spectrum, control experiments and normalized surface area."
    },
    {
      id: "cellulose-nanofiber",
      name: "Cellulose nanofiber",
      family: "Biopolymer nanomaterials",
      formula: "(C6H10O5)n",
      maturity: 86,
      applications: ["Barrier films", "Hydrogels", "Composite reinforcement", "Sustainable packaging"],
      properties: ["High aspect ratio", "Hydrogen bonding", "Renewable feedstock", "Surface hydroxyl chemistry"],
      synthesis: "Mechanical fibrillation often aided by TEMPO oxidation, enzymatic treatment or acid pretreatment.",
      characterization: ["AFM/TEM dimensions", "carboxylate content", "rheology", "crystallinity index", "water retention"],
      limitations: ["Moisture sensitivity", "aggregation on drying", "batch-to-batch biomass variation"],
      linkedReagents: ["tempo-bleach"],
      evidenceLevel: "Report fibrillation energy, surface charge and drying history."
    },
    {
      id: "polyimide-kapton-class",
      name: "Aromatic polyimide",
      family: "High-performance polymers",
      formula: "imide-linked aromatic polymer",
      maturity: 88,
      applications: ["Flexible electronics", "Thermal insulation", "Membranes", "Aerospace films"],
      properties: ["High glass-transition temperature", "Thermal stability", "Solvent resistance", "Low dielectric loss in selected grades"],
      synthesis: "Dianhydride and diamine polyamic acid formation followed by thermal or chemical imidization.",
      characterization: ["FTIR imide bands", "TGA", "DSC/DMA", "tensile testing", "dielectric analysis"],
      limitations: ["Processing difficulty", "imidization stress", "monomer purity sensitivity"],
      linkedReagents: ["maleic-anhydride"],
      evidenceLevel: "Thermal and mechanical claims should include imidization protocol and film thickness."
    },
    {
      id: "epoxy-amine-network",
      name: "Epoxy-amine thermoset",
      family: "Thermoset polymers",
      formula: "crosslinked epoxide-amine network",
      maturity: 88,
      applications: ["Structural composites", "Adhesives", "Coatings", "Encapsulation"],
      properties: ["Crosslink-density control", "High adhesion", "Chemical resistance", "Glass-transition tunability"],
      synthesis: "Step-growth curing between multifunctional epoxides and amines under stoichiometric and thermal control.",
      characterization: ["DSC cure exotherm", "FTIR epoxide conversion", "DMA Tg", "gel fraction", "fracture toughness"],
      limitations: ["Brittleness", "moisture and stoichiometry sensitivity", "diffusion-limited late cure"],
      linkedReagents: ["epichlorohydrin", "amine-nucleophile"],
      evidenceLevel: "Cure schedule, stoichiometry and conversion are required before comparing properties."
    },
    {
      id: "sulfide-solid-electrolyte",
      name: "Sulfide solid electrolyte",
      family: "Battery ion conductors",
      formula: "Li-P-S glass ceramic",
      maturity: 76,
      applications: ["All-solid-state batteries", "Ion-conducting separators", "Composite cathodes", "Interface studies"],
      properties: ["High Li-ion conductivity", "Soft mechanical contact", "Moisture sensitivity", "Interface reactivity"],
      synthesis: "Mechanochemical or solid-state routes using lithium sulfide and phosphorus sulfide precursors followed by annealing.",
      characterization: ["EIS ionic conductivity", "XRD phase", "Raman PS4 units", "air exposure audit", "critical current density"],
      limitations: ["H2S release on moisture exposure", "interfacial decomposition", "processing atmosphere requirement"],
      linkedReagents: ["lithium-sulfide"],
      evidenceLevel: "Conductivity claims need pellet density, blocking electrodes and atmosphere history."
    },
    {
      id: "nasicon-electrolyte",
      name: "NASICON-type solid electrolyte",
      family: "Battery ion conductors",
      formula: "Na1+xZr2SixP3-xO12",
      maturity: 78,
      applications: ["Sodium solid-state batteries", "Ion-selective membranes", "Sensors", "Ceramic separators"],
      properties: ["3D sodium-ion channels", "ceramic stability", "grain-boundary sensitivity", "dopant tunability"],
      synthesis: "Solid-state or sol-gel oxide route followed by high-temperature sintering and density optimization.",
      characterization: ["XRD phase purity", "EIS grain/grain-boundary separation", "SEM density", "relative density", "thermal stability"],
      limitations: ["High sintering temperature", "grain-boundary resistance", "sodium loss"],
      linkedReagents: ["zirconyl-chloride"],
      evidenceLevel: "Separate bulk and grain-boundary conductivity when possible."
    },
    {
      id: "prussian-blue-analog",
      name: "Prussian blue analog",
      family: "Coordination framework cathodes",
      formula: "AxM[Fe(CN)6]1-y.nH2O",
      maturity: 79,
      applications: ["Sodium-ion batteries", "Potassium-ion batteries", "Electrochromics", "Ion sieving"],
      properties: ["Open framework", "redox-active metal centers", "water and vacancy content", "large ion channels"],
      synthesis: "Controlled precipitation from metal salts and hexacyanoferrate sources with chelation or slow-feed control.",
      characterization: ["XRD framework", "ICP stoichiometry", "TGA water", "XPS oxidation state", "electrochemical cycling"],
      limitations: ["vacancy defects", "structural water", "particle-size control"],
      linkedReagents: ["ferricyanide"],
      evidenceLevel: "Report water and vacancy content for meaningful battery comparisons."
    }
  ]);

  addTerms(materialData.propertyAxes, [
    "surface termination", "defect density", "ionic conductivity", "crosslink density", "porosity activation",
    "interfacial adhesion", "photocarrier lifetime", "grain-boundary resistance"
  ]);

  addUnique(materialData.characterizationMethods, [
    {
      id: "xps-surface-chemistry",
      method: "XPS surface chemistry",
      purpose: "Separates surface oxidation state, heteroatom content and termination chemistry from bulk formula claims."
    },
    {
      id: "eis-ion-transport",
      method: "Electrochemical impedance spectroscopy",
      purpose: "Distinguishes bulk, grain-boundary and interfacial resistance in ion conductors and electrochemical devices."
    },
    {
      id: "dma-network-profile",
      method: "Dynamic mechanical analysis",
      purpose: "Maps glass transition, storage modulus and network relaxation for thermoset and elastomer systems."
    }
  ]);

  addUnique(data.routes, [
    { id: "aryl-halide-to-biaryl", start: "Aryl halide", target: "Biaryl", route: ["oxidative addition", "organoboron transmetalation", "reductive elimination"], note: "Suzuki logic requires halide identity, boron partner stability, base and catalyst-ligand evidence." },
    { id: "aryl-halide-to-aryl-amine", start: "Aryl halide", target: "Aryl amine", route: ["oxidative addition", "amine coordination or deprotonation", "C-N reductive elimination"], note: "Buchwald-Hartwig claims should track monoarylation, base compatibility and ligand choice." },
    { id: "terminal-alkyne-to-alkynyl-arene", start: "Terminal alkyne", target: "Alkynyl arene", route: ["copper acetylide formation", "Pd transmetalation", "C(sp2)-C(sp) bond formation"], note: "Audit Glaser homocoupling and copper residue." },
    { id: "aldehyde-to-secondary-amine", start: "Aldehyde", target: "Secondary amine", route: ["carbinolamine", "imine or iminium", "chemoselective hydride reduction"], note: "Reductive amination needs pH, water and overalkylation control." },
    { id: "carboxylic-acid-to-amide", start: "Carboxylic acid", target: "Amide", route: ["acyl activation", "amine addition", "tetrahedral collapse"], note: "Racemization and coupling byproducts define the evidence boundary." },
    { id: "allylic-alcohol-to-chiral-epoxide", start: "Allylic alcohol", target: "Chiral epoxide", route: ["chiral titanium-tartrate complex", "oxygen transfer", "epoxide work-up"], note: "Sharpless epoxidation requires ee measurement and substrate geometry context." },
    { id: "alkene-to-diols-or-epoxides", start: "Alkene", target: "Oxygenated vicinal product", route: ["peracid epoxidation or OsO4 dihydroxylation", "stereospecific oxygen transfer", "work-up selection"], note: "Anti versus syn oxygenation should be justified with mechanism and product stereochemistry." },
    { id: "teos-to-silica-network", start: "Tetraethyl orthosilicate", target: "Silica gel network", route: ["hydrolysis", "condensation", "aging and drying"], note: "Water ratio, pH and drying history determine porosity and cracking." },
    { id: "zirconium-salt-to-uio-66", start: "Zirconium salt", target: "UiO-66", route: ["cluster formation", "linker coordination", "activation"], note: "PXRD alone is insufficient; porosity and defect evidence are needed." },
    { id: "monomer-to-controlled-polymer", start: "Vinyl monomer", target: "Controlled polymer", route: ["reversible radical activation", "chain propagation", "deactivation or fragmentation"], note: "Report conversion, Mn, dispersity and end-group fidelity." },
    { id: "polyol-isocyanate-to-polyurethane", start: "Polyol and isocyanate", target: "Polyurethane network", route: ["urethane formation", "gelation", "post-cure"], note: "NCO index, moisture and cure schedule explain network properties." },
    { id: "biomass-aldehyde-to-upgraded-platform", start: "Furfural", target: "Upgraded furan platform", route: ["hydrogenation or oxidation", "selectivity control", "carbon-balance audit"], note: "Green chemistry claims need mass balance, catalyst lifetime and solvent boundary." }
  ]);

  addUnique(data.concepts, [
    {
      id: "reaction-system-record",
      term: "Reaction system record",
      family: "Research informatics",
      equation: "substrates + catalyst + conditions + readouts + failure modes -> defensible reaction claim",
      definition: "A structured record that treats a reaction as an evidence-bearing system rather than a single named transformation.",
      academicUse: "Use it to compare methods, screen conditions and avoid unsupported mechanism claims.",
      evidenceNote: "A complete record should include negative outcomes and impurity hypotheses, not just isolated yield.",
      sourceRefs: ["iupac-goldbook", "crossref"]
    },
    {
      id: "mechanism-evidence-stack",
      term: "Mechanism evidence stack",
      family: "Mechanistic reasoning",
      equation: "kinetics + isotope effects + stereochemistry + intermediates + controls -> mechanism argument",
      definition: "A layered way to describe how multiple measurements constrain plausible reaction mechanisms.",
      academicUse: "Use it when a named mechanism is tempting but insufficiently proven by product identity alone.",
      evidenceNote: "No single measurement normally proves a mechanism; it narrows alternatives.",
      sourceRefs: ["iupac-goldbook", "pubmed"]
    },
    {
      id: "materials-evidence-boundary",
      term: "Materials evidence boundary",
      family: "Materials characterization",
      equation: "synthesis history + structure + morphology + property test -> material claim",
      definition: "A guardrail for stating material performance only within the characterization and processing history actually measured.",
      academicUse: "Use it to prevent overgeneralizing from one batch, morphology or test condition.",
      evidenceNote: "Performance claims should normalize geometry, loading, active mass and environmental conditions.",
      sourceRefs: ["nist", "crossref"]
    }
  ]);

  addUnique(data.reactants, [
    {
      id: "nitrile-platform",
      name: "Nitrile platform",
      className: "Polar unsaturated functional group",
      functionalGroups: ["C=N nitrile", "alpha-aminonitrile", "cyanoarene"],
      compatibleMethods: ["Hydration", "Reduction", "Cycloaddition", "Nucleophilic addition"],
      evidence: ["Nitrile IR band", "amide or amine conversion", "hydrolysis mass balance"],
      constraints: ["Hydrolysis can stop at amide or continue to acid", "reductions can overreduce sensitive groups"]
    },
    {
      id: "diazonium-salt",
      name: "Aryl diazonium salt",
      className: "Aryl electrophile and radical precursor",
      functionalGroups: ["Ar-N2+", "tetrafluoroborate salt", "diazo coupling partner"],
      compatibleMethods: ["Sandmeyer reaction", "Azo coupling", "Surface grafting", "Photoredox arylation"],
      evidence: ["Low-temperature generation", "nitrogen evolution", "azo chromophore or substitution product"],
      constraints: ["Thermal instability", "counter-ion safety", "water and pH alter coupling outcome"]
    },
    {
      id: "sulfonyl-chloride",
      name: "Sulfonyl chloride",
      className: "Sulfur(VI) electrophile",
      functionalGroups: ["SO2Cl", "aryl sulfonyl chloride", "alkyl sulfonyl chloride"],
      compatibleMethods: ["Sulfonamide formation", "Sulfonate ester formation", "Leaving-group installation"],
      evidence: ["HCl capture", "residual chloride hydrolysis", "S-N or S-O product assignment"],
      constraints: ["Moisture sensitivity", "over-sulfonylation", "base choice controls nucleophile state"]
    },
    {
      id: "acid-chloride",
      name: "Acid chloride",
      className: "Highly activated acyl electrophile",
      functionalGroups: ["COCl", "aroyl chloride", "aliphatic acyl chloride"],
      compatibleMethods: ["Friedel-Crafts acylation", "Amide formation", "Ester formation", "Anhydride formation"],
      evidence: ["Acyl chloride IR", "gas evolution during formation", "hydrolysis control"],
      constraints: ["Hydrolyzes rapidly", "acid-sensitive substrates can fail", "Lewis acid complexes alter selectivity"]
    },
    {
      id: "organolithium-reagent",
      name: "Organolithium reagent",
      className: "Strong organometallic base and nucleophile",
      functionalGroups: ["R-Li", "Ar-Li", "lithiated heteroarene"],
      compatibleMethods: ["Directed metalation", "Carbonyl addition", "Halogen-lithium exchange", "Anion trapping"],
      evidence: ["quench product", "temperature history", "titrated reagent strength"],
      constraints: ["Extremely moisture sensitive", "aggregation and solvent effects", "cryogenic control often required"]
    },
    {
      id: "enolate-nucleophile",
      name: "Enolate nucleophile",
      className: "Carbon nucleophile",
      functionalGroups: ["metal enolate", "silyl enol ether", "enamine equivalent"],
      compatibleMethods: ["Aldol addition", "Claisen condensation", "Michael addition", "Alkylation"],
      evidence: ["regioisomer ratio", "diastereomer ratio", "quench identity"],
      constraints: ["kinetic versus thermodynamic control", "O-alkylation can compete", "self-condensation risk"]
    },
    {
      id: "thiol-click-partner",
      name: "Thiol click partner",
      className: "Soft sulfur nucleophile",
      functionalGroups: ["R-SH", "thiolate", "cysteine residue"],
      compatibleMethods: ["Thiol-ene addition", "Michael addition", "Disulfide exchange", "Surface immobilization"],
      evidence: ["thiol conversion", "disulfide byproduct", "oxygen exclusion record"],
      constraints: ["Oxidation to disulfide", "odor and volatility", "pH controls thiolate concentration"]
    },
    {
      id: "phosphate-ester",
      name: "Phosphate ester",
      className: "Biochemical and flame-retardant motif",
      functionalGroups: ["phosphate monoester", "phosphate diester", "phosphonate"],
      compatibleMethods: ["Phosphorylation", "Hydrolysis", "Surface binding", "Polymer additive design"],
      evidence: ["31P NMR", "hydrolysis rate", "metal-binding control"],
      constraints: ["pH-dependent ionization", "water sensitivity for activated intermediates", "counter-ion effects"]
    },
    {
      id: "strained-cycloalkene",
      name: "Strained cycloalkene",
      className: "High-energy alkene partner",
      functionalGroups: ["norbornene", "cyclooctyne", "trans-cyclooctene"],
      compatibleMethods: ["ROMP", "IEDDA click chemistry", "Olefin metathesis", "Bioorthogonal ligation"],
      evidence: ["strain-release product", "E/Z or stereochemical assignment", "polymer molar mass if polymerized"],
      constraints: ["isomerization and storage stability", "catalyst sensitivity", "steric accessibility"]
    },
    {
      id: "functional-polymer-surface",
      name: "Functional polymer surface",
      className: "Macromolecular interface",
      functionalGroups: ["plasma-oxidized surface", "amine-functional surface", "halogenated polymer", "brush initiator"],
      compatibleMethods: ["Surface-initiated polymerization", "Polydopamine coating", "EDC/NHS immobilization", "Silanization analogs"],
      evidence: ["contact angle", "XPS or ToF-SIMS", "thickness or ellipsometry", "leaching test"],
      constraints: ["surface aging", "heterogeneous coverage", "bulk property interference"]
    }
  ]);

  addUnique(data.reactionSystems, [
    {
      id: "friedel-crafts-acylation",
      name: "Friedel-Crafts acylation",
      className: "Electrophilic aromatic substitution",
      domain: "Organic synthesis",
      maturity: 86,
      substrates: ["acid-chloride"],
      reagents: ["alcl3", "acid-chloride"],
      mechanisms: ["acylium-ion-eas", "activation-leaving-group"],
      conditions: ["Lewis acid activation", "anhydrous solvent", "arene electronics determine rate"],
      readouts: ["aryl ketone product", "regioisomer distribution", "Lewis acid complex work-up"],
      limitations: ["deactivated arenes react poorly", "polyacylation is less common but substrate dependent", "acid chloride hydrolysis"],
      nextQuestions: ["Is the ring activated enough?", "Can rearrangement or complexation occur?", "Is para/ortho selectivity assigned?"]
    },
    {
      id: "nucleophilic-aromatic-substitution",
      name: "Nucleophilic aromatic substitution",
      className: "Addition-elimination on activated aryl systems",
      domain: "Organic synthesis",
      maturity: 84,
      substrates: ["aryl-halide-electrophile", "amine-nucleophile"],
      reagents: ["potassium-carbonate", "sodium-hydride"],
      mechanisms: ["snar-meisenheimer"],
      conditions: ["electron-withdrawing group ortho or para to leaving group", "polar aprotic solvent", "nucleophile deprotonation"],
      readouts: ["Meisenheimer-compatible substitution product", "leaving group balance", "regioisomer audit"],
      limitations: ["unactivated aryl halides fail", "competing Buchwald pathway if metal catalyst present", "base sensitivity"],
      nextQuestions: ["Is the ring activated by nitro, cyano or carbonyl?", "Is benzyne plausible?", "Does nucleophile survive the base?"]
    },
    {
      id: "diazonium-diversification",
      name: "Diazonium diversification",
      className: "Aryl C-X and C-C access from anilines",
      domain: "Organic synthesis",
      maturity: 82,
      substrates: ["diazonium-salt"],
      reagents: ["cui", "hbf4", "sodium-nitrite"],
      mechanisms: ["diazonium-electrophile", "radical-chain-propagation"],
      conditions: ["low-temperature diazotization", "counter-ion controlled isolation", "copper-mediated or photochemical trapping"],
      readouts: ["nitrogen evolution", "aryl halide or azo product", "thermal stability record"],
      limitations: ["explosive or unstable salts", "side reduction", "aqueous pH sensitivity"],
      nextQuestions: ["Can the diazonium salt be used in situ?", "Which counter-ion is safest?", "Is radical or ionic trapping more likely?"]
    },
    {
      id: "epoxide-ring-opening",
      name: "Epoxide ring-opening design",
      className: "Strain-release substitution",
      domain: "Organic synthesis",
      maturity: 88,
      substrates: ["epoxide-strained-ring", "amine-nucleophile", "thiol-click-partner"],
      reagents: ["lewis-acid", "triethylamine"],
      mechanisms: ["activation-leaving-group", "acyl-substitution"],
      conditions: ["acidic or basic activation", "nucleophile identity controls regioselectivity", "temperature limits polymerization"],
      readouts: ["beta-functional alcohol", "regioisomer ratio", "residual epoxide"],
      limitations: ["oligomerization", "water competition", "benzylic epoxides can rearrange"],
      nextQuestions: ["Is attack at less or more substituted carbon expected?", "Is stereochemical inversion proven?", "Can epoxide equivalent weight be measured?"]
    },
    {
      id: "photoredox-catalysis",
      name: "Photoredox catalytic cycle",
      className: "Visible-light single-electron transfer",
      domain: "Organic synthesis",
      maturity: 82,
      substrates: ["diazonium-salt", "alkene-feedstock", "amine-nucleophile"],
      reagents: ["ir-photocatalyst", "organic-dye", "blue-led"],
      mechanisms: ["photoredox-quenching-cycle", "radical-chain-propagation"],
      conditions: ["defined light wavelength", "oxygen control", "sacrificial donor or acceptor"],
      readouts: ["light/dark control", "quantum yield estimate", "radical-trap response"],
      limitations: ["scale-up light penetration", "catalyst photobleaching", "unproven radical chains"],
      nextQuestions: ["Is the reaction light dependent?", "Oxidative or reductive quenching?", "Is chain propagation dominant?"]
    },
    {
      id: "electrochemical-synthesis",
      name: "Electrochemical synthesis cell",
      className: "Electron-as-reagent transformation",
      domain: "Electrochemistry",
      maturity: 80,
      substrates: ["amine-nucleophile", "thiol-click-partner", "functional-polymer-surface"],
      reagents: ["graphite-electrode", "supporting-electrolyte"],
      mechanisms: ["electrochemical-et", "radical-chain-propagation"],
      conditions: ["constant current or potential", "electrode material", "undivided or divided cell"],
      readouts: ["charge passed", "current efficiency", "electrode fouling", "product selectivity"],
      limitations: ["mass transport", "electrode passivation", "hidden chemical oxidants from electrolyte"],
      nextQuestions: ["Is potential controlled or current controlled?", "What is the electrode surface?", "Is Faradaic efficiency reported?"]
    },
    {
      id: "ring-opening-polymerization",
      name: "Ring-opening polymerization",
      className: "Cyclic monomer polymer synthesis",
      domain: "Polymer chemistry",
      maturity: 86,
      substrates: ["epoxide-strained-ring"],
      reagents: ["tin-octoate", "organocatalyst", "lactide"],
      mechanisms: ["ring-opening-polymerization"],
      conditions: ["initiator-to-monomer ratio", "dry monomer", "temperature-controlled propagation"],
      readouts: ["Mn versus conversion", "dispersity", "end-group fidelity", "residual monomer"],
      limitations: ["transesterification", "moisture initiation", "thermal degradation"],
      nextQuestions: ["Is molecular weight predictable?", "Is chain transfer present?", "Can end groups be assigned?"]
    },
    {
      id: "romp-strained-alkene",
      name: "ROMP of strained alkenes",
      className: "Metathesis polymerization",
      domain: "Polymer chemistry",
      maturity: 84,
      substrates: ["strained-cycloalkene"],
      reagents: ["grubbs-catalyst", "chain-transfer-agent"],
      mechanisms: ["metallacyclobutane-cycle"],
      conditions: ["strained cyclic alkene", "Ru carbene catalyst", "monomer-to-initiator ratio"],
      readouts: ["polymer molar mass", "dispersity", "cis/trans double-bond content", "residual catalyst"],
      limitations: ["catalyst poisoning", "broad molar mass at slow initiation", "ruthenium removal"],
      nextQuestions: ["Is initiation faster than propagation?", "Is living character demonstrated?", "Does residual metal affect application?"]
    },
    {
      id: "solid-phase-peptide-synthesis",
      name: "Solid-phase peptide synthesis",
      className: "Iterative amide-bond assembly",
      domain: "Bioconjugation",
      maturity: 90,
      substrates: ["carboxylic-acid-platform", "amine-nucleophile"],
      reagents: ["fmoc-amino-acid", "hatu", "piperidine"],
      mechanisms: ["acyl-substitution", "activation-leaving-group"],
      conditions: ["resin loading", "deprotection cycle", "coupling excess and wash validation"],
      readouts: ["LC-MS crude purity", "deletion sequence audit", "resin loading", "cleavage yield"],
      limitations: ["aggregation on resin", "racemization", "difficult sequences"],
      nextQuestions: ["Is double coupling needed?", "Are deletion products identified?", "Does cleavage damage side chains?"]
    },
    {
      id: "edc-nhs-bioconjugation",
      name: "EDC/NHS bioconjugation",
      className: "Aqueous acyl activation",
      domain: "Bioconjugation",
      maturity: 88,
      substrates: ["carboxylic-acid-platform", "amine-nucleophile", "functional-polymer-surface"],
      reagents: ["edc", "nhs", "mes-buffer"],
      mechanisms: ["acyl-substitution", "activation-leaving-group"],
      conditions: ["pH-managed activation", "short-lived NHS ester", "buffer nucleophile audit"],
      readouts: ["surface nitrogen increase", "protein loading", "unbound molecule washing", "activity retention"],
      limitations: ["hydrolysis", "crosslinking", "random lysine modification"],
      nextQuestions: ["Is pH compatible with biomolecule stability?", "Was free EDC removed?", "Is conjugation site-specific?"]
    },
    {
      id: "enzyme-catalysis-screen",
      name: "Enzyme catalysis screen",
      className: "Biocatalytic transformation",
      domain: "Biocatalysis",
      maturity: 80,
      substrates: ["alcohol-polyol", "aldehyde-ketone-carbonyl", "nitrile-platform"],
      reagents: ["ketoreductase", "lipase", "nitrilase"],
      mechanisms: ["enzyme-michaelis", "hydride-transfer"],
      conditions: ["buffer pH", "cofactor recycling", "substrate loading and cosolvent"],
      readouts: ["conversion", "ee or de", "enzyme stability", "cofactor turnover"],
      limitations: ["substrate inhibition", "cosolvent denaturation", "mass-transfer effects"],
      nextQuestions: ["Is product inhibition present?", "Can cofactor be regenerated?", "Is selectivity measured by chiral method?"]
    },
    {
      id: "polydopamine-surface-coating",
      name: "Polydopamine surface coating",
      className: "Oxidative polymerization and adhesion",
      domain: "Materials chemistry",
      maturity: 82,
      substrates: ["functional-polymer-surface", "biomass-oxygenate"],
      reagents: ["dopamine", "tris-buffer"],
      mechanisms: ["radical-chain-propagation", "surface-silanization"],
      conditions: ["weakly basic aqueous buffer", "oxygen exposure", "substrate immersion time"],
      readouts: ["color and film thickness", "XPS nitrogen/catechol signal", "adhesion or immobilization test"],
      limitations: ["composition heterogeneity", "overstated molecular structure", "pH and oxygen sensitivity"],
      nextQuestions: ["Is coating thickness measured?", "Is leaching tested?", "Does surface roughness change?"]
    }
  ]);

  addUnique(data.compounds, [
    {
      id: "nitrobenzene",
      name: "Nitrobenzene",
      formula: "C6H5NO2",
      cas: "98-95-3",
      family: "Nitroarene",
      synonyms: ["benzene, nitro-"],
      summary: "Electron-poor arene used for reduction to aniline and as an activating group in SNAr logic.",
      evidenceNote: "Reduction state should be assigned by product spectroscopy, not color change alone.",
      tags: ["nitroarene", "SNAr", "aniline precursor"]
    },
    {
      id: "aniline",
      name: "Aniline",
      formula: "C6H7N",
      cas: "62-53-3",
      family: "Aromatic amine",
      synonyms: ["benzenamine"],
      summary: "Aryl amine platform for diazonium chemistry, amide coupling and polymer precursor discussions.",
      evidenceNote: "Free base versus salt state changes reactivity and analytical behavior.",
      tags: ["amine", "diazonium", "aromatic"]
    },
    {
      id: "tosyl-chloride",
      name: "p-Toluenesulfonyl chloride",
      formula: "C7H7ClO2S",
      cas: "98-59-9",
      family: "Sulfonyl chloride",
      synonyms: ["tosyl chloride", "TsCl"],
      summary: "Common reagent for converting alcohols and amines into sulfonate esters or sulfonamides.",
      evidenceNote: "Hydrolysis and over-sulfonylation should be checked in work-up records.",
      tags: ["sulfonyl chloride", "leaving group", "tosylation"]
    },
    {
      id: "acrylonitrile",
      name: "Acrylonitrile",
      formula: "C3H3N",
      cas: "107-13-1",
      family: "Activated alkene nitrile",
      synonyms: ["propenenitrile", "vinyl cyanide"],
      summary: "Electron-poor monomer for polyacrylonitrile and Michael-type additions.",
      evidenceNote: "Inhibitor, toxicity controls and polymerization history are critical.",
      tags: ["monomer", "nitrile", "polymer"]
    },
    {
      id: "lactide",
      name: "Lactide",
      formula: "C6H8O4",
      cas: "95-96-5",
      family: "Cyclic diester",
      synonyms: ["3,6-dimethyl-1,4-dioxane-2,5-dione"],
      summary: "Cyclic monomer for polylactide ring-opening polymerization.",
      evidenceNote: "L-, D- or meso-lactide identity controls polymer stereochemistry and crystallinity.",
      tags: ["monomer", "PLA", "ring-opening polymerization"]
    },
    {
      id: "norbornene",
      name: "Norbornene",
      formula: "C7H10",
      cas: "498-66-8",
      family: "Strained cycloalkene",
      synonyms: ["bicyclo[2.2.1]hept-2-ene"],
      summary: "High-strain alkene used in ROMP and bioorthogonal reaction models.",
      evidenceNote: "Endo/exo substitution and inhibitor history matter in polymerization.",
      tags: ["ROMP", "strained alkene", "metathesis"]
    },
    {
      id: "dimethylformamide",
      name: "N,N-Dimethylformamide",
      formula: "C3H7NO",
      cas: "68-12-2",
      family: "Polar aprotic solvent",
      synonyms: ["DMF"],
      summary: "High-boiling polar aprotic solvent used in coupling, polymer and materials synthesis.",
      evidenceNote: "Water content and decomposition under strong base or heat affect reproducibility.",
      tags: ["solvent", "polar aprotic", "coupling"]
    },
    {
      id: "acetonitrile",
      name: "Acetonitrile",
      formula: "C2H3N",
      cas: "75-05-8",
      family: "Polar aprotic solvent",
      synonyms: ["MeCN", "methyl cyanide"],
      summary: "Common LC-MS and electrochemistry solvent with useful oxidative stability.",
      evidenceNote: "Electrochemical claims require electrolyte and water-content context.",
      tags: ["solvent", "electrochemistry", "LC-MS"]
    },
    {
      id: "triethylamine",
      name: "Triethylamine",
      formula: "C6H15N",
      cas: "121-44-8",
      family: "Tertiary amine base",
      synonyms: ["Et3N", "TEA"],
      summary: "Organic base used for acid scavenging, coupling reactions and eliminations.",
      evidenceNote: "Salt formation and residual amine can complicate purification and spectra.",
      tags: ["base", "amine", "acid scavenger"]
    },
    {
      id: "methyl-methacrylate",
      name: "Methyl methacrylate",
      formula: "C5H8O2",
      cas: "80-62-6",
      family: "Methacrylate monomer",
      synonyms: ["MMA"],
      summary: "Vinyl monomer for PMMA and controlled radical polymerization benchmarks.",
      evidenceNote: "Inhibitor removal and conversion must be reported for polymer comparisons.",
      tags: ["monomer", "PMMA", "radical polymerization"]
    }
  ]);

  addUnique(data.mechanisms, [
    {
      id: "radical-chain-propagation",
      name: "Radical chain propagation",
      className: "Radical chemistry",
      summary: "Radical intermediates consume substrates and regenerate radicals through propagation steps that can outpace initiation.",
      rateLaw: "May show light, initiator or inhibitor dependence; quantum yield above unity suggests chain character.",
      stereo: "Often less stereospecific than concerted pathways unless radical clocks or cages constrain geometry.",
      bestFor: ["photoredox arylation", "thiol-ene addition", "polymerization", "Sandmeyer chemistry"],
      steps: ["radical initiation", "substrate addition or abstraction", "radical transfer regenerates chain carrier"],
      traps: ["oxygen inhibition", "radical scavenger ambiguity", "mistaking initiation for turnover-limiting step"],
      tags: ["radical", "chain", "photoredox"]
    },
    {
      id: "photoredox-quenching-cycle",
      name: "Photoredox quenching cycle",
      className: "Photochemistry",
      summary: "An excited photocatalyst transfers an electron or energy to a quencher, generating reactive open-shell intermediates under visible light.",
      rateLaw: "Stern-Volmer quenching, light intensity and catalyst loading can define the kinetic boundary.",
      stereo: "Stereochemical control is usually supplied by a second catalyst, substrate geometry or radical-pair environment.",
      bestFor: ["visible-light catalysis", "radical generation", "decarboxylative coupling", "diazonium arylation"],
      steps: ["photoexcitation", "oxidative or reductive quenching", "back electron transfer or radical propagation"],
      traps: ["unmeasured light flux", "photobleaching", "thermal background reaction"],
      tags: ["photoredox", "SET", "light"]
    },
    {
      id: "snar-meisenheimer",
      name: "Meisenheimer SNAr pathway",
      className: "Aromatic substitution",
      summary: "A nucleophile adds to an electron-poor aryl halide to form a sigma-adduct that eliminates leaving group and restores aromaticity.",
      rateLaw: "Nucleophile and aryl electrophile terms are expected when addition is rate limiting.",
      stereo: "No stereocenter is usually created at the aryl carbon; regioselectivity follows activating group placement.",
      bestFor: ["activated aryl fluorides", "nitroarenes", "heteroaryl substitution", "medicinal chemistry diversification"],
      steps: ["nucleophilic addition", "Meisenheimer sigma-complex", "leaving group elimination"],
      traps: ["benzyne alternative under harsh base", "unactivated aryl chloride failure", "incorrect leaving-group trend assumptions"],
      tags: ["SNAr", "Meisenheimer", "aryl fluoride"]
    },
    {
      id: "diazonium-electrophile",
      name: "Diazonium substitution manifold",
      className: "Aryl diversification",
      summary: "Aryl diazonium salts can release nitrogen and enter ionic, radical or metal-mediated substitution and coupling pathways.",
      rateLaw: "Often sensitive to temperature, copper salt, counter-ion and trapping nucleophile concentration.",
      stereo: "Aryl substitution does not normally report stereochemistry, but regioselectivity in azo coupling is pH and ring-activation dependent.",
      bestFor: ["Sandmeyer reaction", "azo coupling", "Balz-Schiemann fluorination", "surface grafting"],
      steps: ["diazotization", "nitrogen extrusion", "capture by nucleophile, arene or surface"],
      traps: ["unstable dry salts", "side reduction", "overcoupling in azo dye formation"],
      tags: ["diazonium", "Sandmeyer", "azo"]
    },
    {
      id: "ring-opening-polymerization",
      name: "Ring-opening polymerization mechanism",
      className: "Polymer mechanism",
      summary: "A cyclic monomer opens at a reactive chain end, converting ring strain or heteroatom activation into polymer growth.",
      rateLaw: "Monomer, initiator and catalyst terms depend on coordination-insertion, anionic, cationic or organocatalytic pathway.",
      stereo: "Monomer stereochemistry and catalyst environment can control tacticity and crystallinity.",
      bestFor: ["lactide polymerization", "caprolactone polymerization", "epoxide polymerization", "cyclic carbonate polymerization"],
      steps: ["initiation at monomer", "ring opening", "chain propagation and termination or quench"],
      traps: ["transesterification", "adventitious water initiation", "broad dispersity at high conversion"],
      tags: ["ROP", "polymer", "monomer"]
    },
    {
      id: "electrochemical-et",
      name: "Electrochemical electron transfer",
      className: "Electrochemistry",
      summary: "An electrode supplies or removes electrons at a defined interface, generating intermediates without stoichiometric redox reagents.",
      rateLaw: "Current, potential, mass transport and electrode area jointly shape observed rate.",
      stereo: "Stereochemical outcome depends on follow-up chemistry after electron transfer.",
      bestFor: ["anodic oxidation", "cathodic reduction", "electrosynthesis", "surface functionalization"],
      steps: ["diffusion to electrode", "electron transfer", "chemical follow-up and product release"],
      traps: ["unreported electrode area", "passivation", "supporting electrolyte participation"],
      tags: ["electrochemistry", "electron transfer", "cell design"]
    },
    {
      id: "enzyme-michaelis",
      name: "Michaelis-Menten enzyme turnover",
      className: "Biocatalysis",
      summary: "An enzyme binds substrate, forms a catalytic complex and releases product with saturation behavior at high substrate concentration.",
      rateLaw: "v = Vmax[S]/(Km + [S]) under initial-rate assumptions.",
      stereo: "Chiral active sites can deliver high enantioselectivity or diastereoselectivity.",
      bestFor: ["ketoreductase reduction", "lipase esterification", "nitrilase hydrolysis", "transaminase chemistry"],
      steps: ["substrate binding", "chemical conversion", "product release and cofactor reset"],
      traps: ["substrate inhibition", "mass-transfer artifacts", "cofactor depletion"],
      tags: ["enzyme", "kinetics", "biocatalysis"]
    },
    {
      id: "acylium-ion-eas",
      name: "Acylium ion electrophilic aromatic substitution",
      className: "Aromatic substitution",
      summary: "A Lewis acid activates an acid chloride or anhydride to generate an acylium-like electrophile that substitutes onto an aromatic ring.",
      rateLaw: "Arene electronics, electrophile generation and Lewis acid stoichiometry govern observed rate.",
      stereo: "Regiochemistry follows substituent directing effects; stereochemistry is usually not central.",
      bestFor: ["Friedel-Crafts acylation", "aryl ketone synthesis", "aromatic substitution teaching"],
      steps: ["acylium generation", "arene attack to sigma complex", "deprotonation and catalyst work-up"],
      traps: ["Lewis acid complexation", "deactivated arenes", "hydrolysis of acid chloride"],
      tags: ["Friedel-Crafts", "EAS", "acylium"]
    }
  ]);

  addUnique(materialData.materials, [
    {
      id: "polydopamine-coating",
      name: "Polydopamine coating",
      family: "Bioinspired surface coatings",
      formula: "heterogeneous catecholamine polymer",
      maturity: 82,
      applications: ["Surface adhesion", "Biomolecule immobilization", "Membrane modification", "Nanoparticle coating"],
      properties: ["Broad substrate adhesion", "catechol/amine functionality", "redox-active surface", "secondary functionalization"],
      synthesis: "Oxidative polymerization of dopamine in weakly basic aqueous buffer on immersed substrates.",
      characterization: ["XPS nitrogen signal", "ellipsometry thickness", "contact angle", "AFM roughness", "leaching test"],
      limitations: ["ill-defined molecular structure", "pH and oxygen sensitivity", "batch-to-batch film variation"],
      linkedReagents: ["dopamine"],
      evidenceLevel: "A PDA coating claim needs surface-specific evidence and washing/leaching controls."
    },
    {
      id: "peg-hydrogel",
      name: "PEG hydrogel",
      family: "Hydrogels",
      formula: "crosslinked poly(ethylene glycol)",
      maturity: 86,
      applications: ["Tissue engineering", "Drug delivery research", "Protein-resistant coatings", "Soft lithography"],
      properties: ["High water content", "tunable mesh size", "low protein adsorption", "functional end-group chemistry"],
      synthesis: "Photocrosslinking, Michael addition or click crosslinking of multi-arm PEG macromers.",
      characterization: ["swelling ratio", "rheology", "gel fraction", "mesh-size estimate", "cytotoxicity control"],
      limitations: ["weak mechanical strength at high swelling", "photoinitiator residue", "network defects"],
      linkedReagents: ["azide-alkyne-pair"],
      evidenceLevel: "Report macromer functionality, crosslinking conversion and swelling medium."
    },
    {
      id: "pnipam-hydrogel",
      name: "PNIPAM hydrogel",
      family: "Stimuli-responsive polymers",
      formula: "poly(N-isopropylacrylamide) network",
      maturity: 82,
      applications: ["Thermoresponsive actuators", "controlled release", "cell-sheet research", "microgels"],
      properties: ["LCST near aqueous room/body temperature range", "reversible swelling collapse", "copolymer tunability", "soft network mechanics"],
      synthesis: "Free-radical or controlled radical polymerization with crosslinker and aqueous precipitation options.",
      characterization: ["DSC or turbidimetry LCST", "swelling ratio versus temperature", "rheology", "particle size for microgels"],
      limitations: ["hysteresis", "slow diffusion in bulk gels", "residual monomer concerns"],
      linkedReagents: ["raft-agent", "aibn"],
      evidenceLevel: "Thermoresponse must be measured under stated salt, pH and concentration conditions."
    },
    {
      id: "pdms-elastomer",
      name: "PDMS elastomer",
      family: "Silicone elastomers",
      formula: "crosslinked polydimethylsiloxane",
      maturity: 90,
      applications: ["Microfluidics", "soft lithography", "flexible devices", "biomedical device prototypes"],
      properties: ["optical transparency", "gas permeability", "low modulus", "hydrophobic surface"],
      synthesis: "Hydrosilylation curing of vinyl and hydride silicone prepolymers with platinum catalyst.",
      characterization: ["mix ratio and cure schedule", "tensile modulus", "contact angle", "extractables", "surface oxidation lifetime"],
      limitations: ["hydrophobic recovery", "small molecule absorption", "swelling in organic solvents"],
      linkedReagents: ["silane-coupling-agent"],
      evidenceLevel: "PDMS device claims need cure ratio, surface treatment age and solvent exposure history."
    },
    {
      id: "mapbi3-perovskite",
      name: "Methylammonium lead iodide perovskite",
      family: "Hybrid perovskites",
      formula: "CH3NH3PbI3",
      maturity: 76,
      applications: ["Photovoltaics", "photodetectors", "optoelectronic research", "defect studies"],
      properties: ["strong visible absorption", "long carrier diffusion length", "ion migration", "moisture sensitivity"],
      synthesis: "Solution deposition or vapor-assisted conversion of lead iodide and methylammonium iodide precursors.",
      characterization: ["XRD phase", "UV-Vis absorption", "photoluminescence", "SEM grain morphology", "device J-V protocol"],
      limitations: ["lead toxicity", "moisture and thermal instability", "hysteresis"],
      linkedReagents: ["lead-iodide"],
      evidenceLevel: "Device claims require scan protocol, encapsulation state and stability measurement."
    },
    {
      id: "nmc-cathode",
      name: "Layered NMC cathode",
      family: "Battery cathodes",
      formula: "LiNixMnyCozO2",
      maturity: 84,
      applications: ["Lithium-ion batteries", "composite cathodes", "degradation studies", "solid-state interfaces"],
      properties: ["layered oxide structure", "nickel-rich capacity", "surface reconstruction risk", "transition-metal redox"],
      synthesis: "Co-precipitation of transition-metal hydroxide or carbonate followed by lithiation and calcination.",
      characterization: ["XRD Rietveld or cation mixing", "SEM secondary particles", "ICP stoichiometry", "electrochemical cycling", "XPS surface"],
      limitations: ["moisture sensitivity", "microcracking", "surface impedance growth"],
      linkedReagents: ["lithium-hydroxide"],
      evidenceLevel: "Report composition, calcination, electrode loading and voltage window."
    },
    {
      id: "silicon-graphite-anode",
      name: "Silicon-graphite composite anode",
      family: "Battery anodes",
      formula: "Si/C composite",
      maturity: 80,
      applications: ["High-energy lithium-ion anodes", "binder studies", "SEI research", "fast-charge analysis"],
      properties: ["high theoretical capacity", "volume expansion", "conductive carbon network", "binder-dependent stability"],
      synthesis: "Mechanical blending, carbon coating or composite particle engineering with graphite and polymer binder.",
      characterization: ["particle morphology", "electrode density", "first-cycle coulombic efficiency", "EIS", "postmortem SEM"],
      limitations: ["volume-change fracture", "low initial efficiency", "electrolyte consumption"],
      linkedReagents: ["vinylene-carbonate"],
      evidenceLevel: "Normalize capacity to active mass and report pre-lithiation or additive strategy."
    },
    {
      id: "biochar-adsorbent",
      name: "Biochar adsorbent",
      family: "Biomass-derived carbons",
      formula: "pyrolyzed biomass carbon",
      maturity: 78,
      applications: ["Water treatment", "soil amendment", "catalyst support", "carbon sequestration research"],
      properties: ["ash content", "surface oxygen functionality", "porosity", "feedstock-dependent composition"],
      synthesis: "Pyrolysis or hydrothermal carbonization followed by activation or surface oxidation when required.",
      characterization: ["proximate analysis", "BET surface area", "pH at point of zero charge", "FTIR/XPS", "adsorption isotherm"],
      limitations: ["feedstock variability", "inorganic ash effects", "leaching of dissolved organics"],
      linkedReagents: ["koh"],
      evidenceLevel: "Biochar claims must specify feedstock, pyrolysis temperature and washing protocol."
    }
  ]);

  window.CHEMVAULT_WORKBENCH = {
    lenses: [
      { id: "organic", label: "Organic synthesis", query: "cross-coupling amide carbonyl stereochemistry" },
      { id: "materials", label: "Materials chemistry", query: "MOF sol-gel polymer electrolyte surface" },
      { id: "mechanistic", label: "Mechanistic audit", query: "kinetics isotope stereochemistry intermediate" },
      { id: "green", label: "Green chemistry", query: "biomass solvent catalyst atom economy" }
    ],
    evidenceQueue: [
      { id: "eq-001", title: "Do not call a MOF record complete from PXRD alone", domain: "Materials", severity: "high", action: "Add activation, BET and solvent-exchange evidence before comparing adsorption." },
      { id: "eq-002", title: "Separate reaction name from mechanism proof", domain: "Mechanism", severity: "high", action: "Attach kinetics, stereochemical outcome or control experiments to the named pathway." },
      { id: "eq-003", title: "Treat imported NIH/PubChem metadata as discovery", domain: "Source policy", severity: "medium", action: "Show source links and identifiers, then keep local notes concise and citable." },
      { id: "eq-004", title: "Polymer claims need molar-mass data", domain: "Polymer", severity: "medium", action: "Add Mn, dispersity, conversion and purification history." },
      { id: "eq-005", title: "Battery electrolyte claims need interfacial context", domain: "Materials", severity: "medium", action: "Document electrode loading, formation protocol, water content and impedance model." }
    ]
  };
})();
