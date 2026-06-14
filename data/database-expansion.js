(() => {
  const data = window.CHEMVAULT_DATA || (window.CHEMVAULT_DATA = {});
  const materialData = window.CHEMVAULT_MATERIALS || (window.CHEMVAULT_MATERIALS = { materials: [], propertyAxes: [], characterizationMethods: [] });

  data.compounds = data.compounds || [];
  data.reagents = data.reagents || [];
  data.routes = data.routes || [];
  data.concepts = data.concepts || [];
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

  function mergeUnique(list, items) {
    const byId = new Map(list.map((item) => [item.id, item]));
    items.forEach((item) => {
      const existing = byId.get(item.id);
      if (!existing) {
        list.push(item);
        byId.set(item.id, item);
        return;
      }
      const tags = [...new Set([...(existing.tags || []), ...(item.tags || [])])];
      const synonyms = [...new Set([...(existing.synonyms || []), ...(item.synonyms || [])])];
      Object.assign(existing, item, { tags, synonyms, raw: { ...(existing.raw || {}), ...(item.raw || {}) } });
    });
  }

  addUnique(data.compounds, [
    {
      id: "isobutenylbenzene",
      name: "Isobutenylbenzene",
      formula: "C10H12",
      cas: "768-49-0",
      family: "Aromatic alkene",
      synonyms: ["2-methyl-1-phenylpropene", "2-methylprop-1-enylbenzene"],
      summary: "A substituted styrene-like alkene used as a query example for linking compound identity to PubChem and PubMed metadata.",
      evidenceNote: "Confirm exact isomer, stereochemistry and synonym set against PubChem before citing physical properties.",
      tags: ["alkene", "aromatic", "styrene", "PubChem"]
    },
    {
      id: "aspirin",
      name: "Aspirin",
      formula: "C9H8O4",
      cas: "50-78-2",
      family: "Carboxylic acid ester",
      synonyms: ["acetylsalicylic acid", "ASA"],
      summary: "Benchmark small molecule for acid, ester and pharmaceutical metadata searches.",
      evidenceNote: "Use PubChem for identifiers and PubMed for biomedical literature context.",
      tags: ["drug", "ester", "carboxylic acid", "NIH"]
    },
    {
      id: "caffeine",
      name: "Caffeine",
      formula: "C8H10N4O2",
      cas: "58-08-2",
      family: "Xanthine alkaloid",
      synonyms: ["1,3,7-trimethylxanthine"],
      summary: "Nitrogen-rich heterocycle used in spectroscopy, extraction and pharmacology examples.",
      evidenceNote: "Report hydration state and source when comparing melting point or spectra.",
      tags: ["alkaloid", "heterocycle", "stimulant"]
    },
    {
      id: "acetaminophen",
      name: "Acetaminophen",
      formula: "C8H9NO2",
      cas: "103-90-2",
      family: "Phenolic amide",
      synonyms: ["paracetamol", "APAP"],
      summary: "Phenolic amide often used for teaching functional-group analysis and drug metabolism context.",
      evidenceNote: "Distinguish compound identity from formulation and dosage claims.",
      tags: ["phenol", "amide", "drug"]
    },
    {
      id: "ibuprofen",
      name: "Ibuprofen",
      formula: "C13H18O2",
      cas: "15687-27-1",
      family: "Arylpropionic acid",
      synonyms: ["2-(4-isobutylphenyl)propionic acid"],
      summary: "Chiral carboxylic acid drug useful for stereochemistry, acid-base extraction and literature-search cases.",
      evidenceNote: "State racemate or enantiomer when making biological or physical-property claims.",
      tags: ["chiral", "carboxylic acid", "drug"]
    },
    {
      id: "benzaldehyde",
      name: "Benzaldehyde",
      formula: "C7H6O",
      cas: "100-52-7",
      family: "Aromatic aldehyde",
      synonyms: ["benzenecarbaldehyde"],
      summary: "Aromatic aldehyde standard for carbonyl spectroscopy, oxidation and reduction comparisons.",
      evidenceNote: "Aldehydic proton and carbonyl features should be interpreted together.",
      tags: ["aldehyde", "aromatic", "spectroscopy"]
    },
    {
      id: "acetophenone",
      name: "Acetophenone",
      formula: "C8H8O",
      cas: "98-86-2",
      family: "Aromatic ketone",
      synonyms: ["methyl phenyl ketone"],
      summary: "Simple aryl ketone used for hydride selectivity and carbonyl assignment examples.",
      evidenceNote: "Ketone assignment should not rely on IR alone; use NMR and reference comparison.",
      tags: ["ketone", "aromatic", "carbonyl"]
    },
    {
      id: "styrene",
      name: "Styrene",
      formula: "C8H8",
      cas: "100-42-5",
      family: "Vinyl arene",
      synonyms: ["ethenylbenzene"],
      summary: "Polymerizable vinyl arene linking organic reactivity, radical polymerization and materials chemistry.",
      evidenceNote: "Inhibitor content and polymerization history matter for experimental interpretation.",
      tags: ["alkene", "polymer", "aromatic"]
    },
    {
      id: "salicylic-acid",
      name: "Salicylic acid",
      formula: "C7H6O3",
      cas: "69-72-7",
      family: "Hydroxybenzoic acid",
      synonyms: ["2-hydroxybenzoic acid"],
      summary: "Phenolic acid precursor context for aspirin synthesis and acid-base extraction.",
      evidenceNote: "Intramolecular hydrogen bonding can affect spectral interpretation.",
      tags: ["phenol", "carboxylic acid", "aspirin"]
    },
    {
      id: "dmso",
      name: "Dimethyl sulfoxide",
      formula: "C2H6OS",
      cas: "67-68-5",
      family: "Polar aprotic solvent",
      synonyms: ["DMSO"],
      summary: "Common solvent and oxidation-system component in Swern-type chemistry.",
      evidenceNote: "Residual solvent peaks and water content should be recorded in NMR contexts.",
      tags: ["solvent", "sulfoxide", "NMR"]
    },
    {
      id: "dmf",
      name: "N,N-Dimethylformamide",
      formula: "C3H7NO",
      cas: "68-12-2",
      family: "Polar aprotic solvent",
      synonyms: ["DMF"],
      summary: "High-boiling polar solvent used in substitution, coupling and polymer chemistry.",
      evidenceNote: "Toxicity and residual solvent burden should be separated from reaction scope claims.",
      tags: ["solvent", "amide", "coupling"]
    },
    {
      id: "acetonitrile",
      name: "Acetonitrile",
      formula: "C2H3N",
      cas: "75-05-8",
      family: "Nitrile solvent",
      synonyms: ["MeCN"],
      summary: "Polar solvent commonly used in HPLC, electrochemistry and synthetic methods.",
      evidenceNote: "Water content and grade can affect electrochemical and kinetic claims.",
      tags: ["solvent", "HPLC", "electrochemistry"]
    },
    {
      id: "thf",
      name: "Tetrahydrofuran",
      formula: "C4H8O",
      cas: "109-99-9",
      family: "Ether solvent",
      synonyms: ["THF"],
      summary: "Coordinating ether solvent used with organometallics and hydride reagents.",
      evidenceNote: "Peroxide risk and dryness should be stated for sensitive reactions.",
      tags: ["solvent", "ether", "organometallic"]
    },
    {
      id: "ferrocene",
      name: "Ferrocene",
      formula: "C10H10Fe",
      cas: "102-54-5",
      family: "Organometallic sandwich complex",
      synonyms: ["bis(cyclopentadienyl)iron"],
      summary: "Stable organometallic reference compound for redox, symmetry and spectroscopy examples.",
      evidenceNote: "Electrochemical comparisons require reference electrode and electrolyte conditions.",
      tags: ["organometallic", "redox", "electrochemistry"]
    },
    {
      id: "glucose",
      name: "D-Glucose",
      formula: "C6H12O6",
      cas: "50-99-7",
      family: "Carbohydrate",
      synonyms: ["dextrose"],
      summary: "Reducing sugar used in stereochemistry, solubility and biochemical context searches.",
      evidenceNote: "Anomeric form and hydration state matter for detailed structural claims.",
      tags: ["carbohydrate", "biochemistry", "stereochemistry"]
    }
  ]);

  addUnique(data.reagents, [
    {
      id: "mcpba",
      name: "meta-Chloroperoxybenzoic acid",
      formula: "mCPBA",
      category: "Oxidation",
      risk: "oxidizer",
      focus: "Epoxidation and Baeyer-Villiger oxidation",
      tags: ["peracid", "epoxidation", "alkene", "oxidation"],
      transformations: ["Alkene to epoxide", "Ketone to ester or lactone in Baeyer-Villiger contexts"],
      conditions: ["Often used in chlorinated solvent at controlled temperature", "Buffering may reduce acid-sensitive side reactions"],
      scope: "Useful electrophilic oxygen-transfer reagent for alkene and carbonyl chemistry.",
      mechanism: "Concerted oxygen transfer to alkenes or Criegee-type rearrangement after peracid addition to carbonyls.",
      traps: ["Commercial material may contain stabilizer and water", "Electron-rich alkenes react faster than electron-poor alkenes"],
      safety: "Organic peroxide oxidizer. Avoid friction, heat and incompatible reducing agents."
    },
    {
      id: "nbs",
      name: "N-Bromosuccinimide",
      formula: "NBS",
      category: "Halogenation",
      risk: "oxidizer",
      focus: "Allylic bromination and bromonium chemistry",
      tags: ["bromination", "radical", "allylic", "alkene"],
      transformations: ["Allylic C-H to allylic bromide", "Alkene bromination under ionic conditions"],
      conditions: ["Radical initiator or light for allylic bromination", "Solvent and water content tune ionic pathways"],
      scope: "Common bromine source when lower free bromine concentration is desired.",
      mechanism: "Radical chain bromination or electrophilic bromine transfer depending on conditions.",
      traps: ["Competing addition to alkenes can occur", "Regioselectivity follows radical stability and product distribution"],
      safety: "Irritant oxidizer. Avoid incompatible organics and reducing agents."
    },
    {
      id: "lda",
      name: "Lithium diisopropylamide",
      formula: "LDA",
      category: "Base",
      risk: "dry",
      focus: "Kinetic enolate formation",
      tags: ["base", "enolate", "kinetic", "organolithium"],
      transformations: ["Carbonyl compound to lithium enolate", "Directed deprotonation of acidic C-H sites"],
      conditions: ["Dry THF", "Low temperature often used for kinetic control"],
      scope: "Strong hindered non-nucleophilic base for enolate and deprotonation chemistry.",
      mechanism: "Lithium amide abstracts an acidic proton with aggregation and solvent effects.",
      traps: ["Moisture destroys reagent", "Thermodynamic versus kinetic enolate claims require conditions"],
      safety: "Strong base and moisture sensitive. Use inert-atmosphere controls."
    },
    {
      id: "nbuli",
      name: "n-Butyllithium",
      formula: "n-BuLi",
      category: "Organometallic",
      risk: "pyrophoric",
      focus: "Strong base and organolithium reagent",
      tags: ["organolithium", "base", "lithiation", "pyrophoric"],
      transformations: ["Halogen-lithium exchange", "Directed ortho metalation", "Strong deprotonation"],
      conditions: ["Dry hydrocarbon or ether solvent", "Low-temperature addition for selectivity"],
      scope: "Powerful reagent for generating organolithium species and performing metal-halogen exchange.",
      mechanism: "Polar organolithium reactivity shaped by aggregation, solvent and substrate acidity.",
      traps: ["Titration matters for stoichiometry", "Side reactions increase with temperature and electrophile incompatibility"],
      safety: "Pyrophoric solution. Requires trained handling and strict exclusion of air and moisture."
    },
    {
      id: "pd-c",
      name: "Palladium on carbon",
      formula: "Pd/C",
      category: "Catalysis",
      risk: "flammable",
      focus: "Catalytic hydrogenation and hydrogenolysis",
      tags: ["hydrogenation", "catalyst", "alkene", "benzyl"],
      transformations: ["Alkene to alkane", "Benzyl protecting group hydrogenolysis", "Nitro reduction under hydrogenation conditions"],
      conditions: ["Hydrogen atmosphere", "Solvent and catalyst loading define rate and selectivity"],
      scope: "Heterogeneous palladium catalyst for transfer or gas-phase hydrogenation workflows.",
      mechanism: "Substrate adsorption, surface hydrogen transfer and product desorption.",
      traps: ["Catalyst can ignite when dry", "Poisoning and over-reduction must be considered"],
      safety: "Keep wet as supplied and follow hydrogenation risk assessment."
    },
    {
      id: "raney-nickel",
      name: "Raney nickel",
      formula: "Ra-Ni",
      category: "Catalysis",
      risk: "pyrophoric",
      focus: "Hydrogenation and desulfurization",
      tags: ["hydrogenation", "nickel", "desulfurization", "catalyst"],
      transformations: ["Alkene or alkyne hydrogenation", "Thioacetal desulfurization", "Nitro group reduction"],
      conditions: ["Hydrogen or transfer hydrogenation conditions", "Wet catalyst handling"],
      scope: "Porous nickel catalyst used where palladium selectivity or cost is unsuitable.",
      mechanism: "Surface-mediated hydrogen transfer and adsorption-controlled reduction.",
      traps: ["Highly dependent on catalyst grade and activation", "Dry material is dangerous"],
      safety: "Pyrophoric catalyst. Keep wet and handle under institutional controls."
    },
    {
      id: "soc2",
      name: "Thionyl chloride",
      formula: "SOCl2",
      category: "Activation",
      risk: "corrosive",
      focus: "Alcohol and acid chloride formation",
      tags: ["chlorination", "acid chloride", "alcohol", "activation"],
      transformations: ["Carboxylic acid to acid chloride", "Alcohol to alkyl chloride"],
      conditions: ["Often used neat or with catalytic DMF", "Gas evolution requires venting strategy"],
      scope: "Converts oxygenated functional groups into more reactive chlorides.",
      mechanism: "Formation of chlorosulfite or acyl chlorosulfite intermediate followed by substitution.",
      traps: ["Stereochemical outcome for alcohols is condition-dependent", "Acid-sensitive substrates can degrade"],
      safety: "Corrosive, lachrymatory and releases acidic gases."
    },
    {
      id: "oxalyl-chloride",
      name: "Oxalyl chloride",
      formula: "(COCl)2",
      category: "Activation",
      risk: "corrosive",
      focus: "Acid chloride formation and Swern activation",
      tags: ["acid chloride", "Swern", "activation", "chlorination"],
      transformations: ["Carboxylic acid to acid chloride", "DMSO activation in Swern oxidation"],
      conditions: ["Dry solvent", "Low temperature for Swern-type oxidation"],
      scope: "Reactive chlorinating and activating agent for acid derivatives and oxidation systems.",
      mechanism: "Acyl chloride formation or activation of DMSO followed by alkoxysulfonium chemistry.",
      traps: ["Gas evolution and exotherm require control", "Water-sensitive reagent"],
      safety: "Corrosive and toxic gas evolution. Use strict ventilation and trained handling."
    },
    {
      id: "lawessons-reagent",
      name: "Lawesson's reagent",
      formula: "C14H14O2P2S4",
      category: "Thionation",
      risk: "standard",
      focus: "Carbonyl to thiocarbonyl conversion",
      tags: ["thionation", "thiocarbonyl", "amide", "phosphorus"],
      transformations: ["Amide to thioamide", "Ketone or ester to thiocarbonyl derivative"],
      conditions: ["Heated organic solvent", "Substrate and solvent control selectivity"],
      scope: "Useful sulfur-transfer reagent for thioamide and thiocarbonyl synthesis.",
      mechanism: "Reactive phosphorus-sulfur species deliver sulfur to carbonyl substrates.",
      traps: ["Functional-group compatibility needs procedure evidence", "Odor and byproducts complicate work-up"],
      safety: "Use hood controls and consult SDS for sulfur/phosphorus reagent hazards."
    },
    {
      id: "ibx",
      name: "2-Iodoxybenzoic acid",
      formula: "IBX",
      category: "Oxidation",
      risk: "oxidizer",
      focus: "Alcohol oxidation",
      tags: ["hypervalent iodine", "oxidation", "alcohol", "carbonyl"],
      transformations: ["Primary alcohol to aldehyde", "Secondary alcohol to ketone"],
      conditions: ["DMSO or other compatible solvent systems", "Temperature and solubility affect rate"],
      scope: "Hypervalent iodine oxidant often compared with Dess-Martin periodinane.",
      mechanism: "Ligand exchange at iodine followed by elimination to carbonyl product.",
      traps: ["Solubility can limit use", "Thermal and impact sensitivity reports require caution"],
      safety: "Oxidizer. Avoid heating dry material and follow institutional controls."
    },
    {
      id: "wilkinson-catalyst",
      name: "Wilkinson's catalyst",
      formula: "RhCl(PPh3)3",
      category: "Catalysis",
      risk: "standard",
      focus: "Homogeneous alkene hydrogenation",
      tags: ["rhodium", "hydrogenation", "homogeneous", "alkene"],
      transformations: ["Alkene to alkane under hydrogen", "Coordination chemistry teaching examples"],
      conditions: ["Hydrogen atmosphere", "Solvent, ligand and substrate coordination affect activity"],
      scope: "Classic homogeneous hydrogenation catalyst with strong mechanistic teaching value.",
      mechanism: "Ligand dissociation, oxidative addition of hydrogen, alkene coordination, migratory insertion and reductive elimination.",
      traps: ["Poisoning by strongly coordinating groups", "Air sensitivity varies with handling and purity"],
      safety: "Precious-metal catalyst and hydrogenation conditions require suitable controls."
    }
  ]);

  addUnique(materialData.materials, [
    {
      id: "pmma",
      name: "Poly(methyl methacrylate)",
      family: "Acrylic polymers",
      formula: "(C5O2H8)n",
      maturity: 86,
      applications: ["Optical plastics", "Microfluidics", "Dental materials", "Lithography"],
      properties: ["High optical clarity", "Glass transition near room-use range", "Good weathering", "Brittle compared with elastomers"],
      synthesis: "Prepared by free-radical polymerization of methyl methacrylate with thermal or photochemical initiators.",
      characterization: ["GPC molecular weight", "DSC glass transition", "FTIR ester bands", "Optical transmittance"],
      limitations: ["Molecular weight and tacticity affect properties", "Residual monomer can bias biocompatibility claims", "Crazing and solvent sensitivity matter"],
      linkedReagents: ["aibn", "benzoyl-peroxide"],
      evidenceLevel: "Polymer claims need molecular weight, dispersity, additive content and thermal history."
    },
    {
      id: "pvdf",
      name: "Poly(vinylidene fluoride)",
      family: "Fluoropolymers",
      formula: "(C2H2F2)n",
      maturity: 84,
      applications: ["Battery binders", "Membranes", "Piezoelectric films", "Chemical-resistant coatings"],
      properties: ["Chemical resistance", "Polymorph-dependent piezoelectricity", "Hydrophobicity", "Thermal stability"],
      synthesis: "Industrial fluoropolymer produced by vinylidene fluoride polymerization; processing controls crystalline phase.",
      characterization: ["FTIR beta-phase fraction", "DSC melting transition", "XRD polymorph", "Contact angle"],
      limitations: ["Processing history controls phase", "Solvent casting can leave residual solvent", "Binder claims need electrode formulation context"],
      linkedReagents: ["dmf"],
      evidenceLevel: "PVDF records need phase, processing route and additive context."
    },
    {
      id: "polystyrene",
      name: "Polystyrene",
      family: "Vinyl polymers",
      formula: "(C8H8)n",
      maturity: 88,
      applications: ["Model polymer", "Foams", "Insulation", "Particle standards"],
      properties: ["Aromatic side groups", "Amorphous glassy polymer", "Good processability", "Low polarity"],
      synthesis: "Prepared by radical, anionic or controlled polymerization of styrene.",
      characterization: ["GPC molecular weight", "DSC glass transition", "NMR tacticity", "SEC-MALS"],
      limitations: ["Thermal and mechanical claims depend on molecular weight", "Foam behavior is not bulk polymer behavior", "Additives alter properties"],
      linkedReagents: ["aibn", "nbuli"],
      evidenceLevel: "State molecular weight, dispersity and architecture before comparing properties."
    },
    {
      id: "polyethylene-glycol",
      name: "Poly(ethylene glycol)",
      family: "Polyethers",
      formula: "HO-(CH2CH2O)n-H",
      maturity: 86,
      applications: ["Bioconjugation", "Hydrogels", "Drug delivery", "Solubilizing excipient"],
      properties: ["Hydrophilicity", "Molecular-weight tunability", "Low protein adsorption", "Flexible chain"],
      synthesis: "Produced by ethylene oxide polymerization or used as functionalized PEG derivatives.",
      characterization: ["MALDI or GPC mass", "NMR end groups", "DSC crystallinity", "Water uptake"],
      limitations: ["Molecular weight distribution controls behavior", "End-group purity matters", "Biological claims require assay context"],
      linkedReagents: ["edc", "dmap"],
      evidenceLevel: "PEG claims need molecular weight, end-group identity and dispersity."
    },
    {
      id: "zsm-5",
      name: "ZSM-5 zeolite",
      family: "Microporous aluminosilicates",
      formula: "MFI aluminosilicate",
      maturity: 87,
      applications: ["Catalysis", "Molecular sieving", "Aromatization", "Adsorption"],
      properties: ["MFI pore network", "Bronsted acidity", "Shape selectivity", "Hydrothermal stability"],
      synthesis: "Hydrothermal crystallization of silica and alumina sources with organic structure-directing agents.",
      characterization: ["PXRD MFI phase", "N2 adsorption", "NH3-TPD acidity", "SEM crystal morphology"],
      limitations: ["Si/Al ratio controls acidity", "Template removal and defects matter", "Diffusion limits affect catalytic interpretation"],
      linkedReagents: ["tea-solgel"],
      evidenceLevel: "Zeolite claims need phase, Si/Al ratio, acidity and calcination history."
    },
    {
      id: "alumina",
      name: "Aluminium oxide",
      family: "Oxide supports",
      formula: "Al2O3",
      maturity: 88,
      applications: ["Catalyst support", "Chromatography", "Ceramics", "Adsorbents"],
      properties: ["Lewis acidity", "High thermal stability", "Phase-dependent surface area", "Mechanical robustness"],
      synthesis: "Produced by precipitation, calcination or sol-gel routes with phase determined by thermal history.",
      characterization: ["XRD phase", "BET area", "Surface acidity", "SEM morphology"],
      limitations: ["Gamma, alpha and other phases differ strongly", "Surface hydroxylation affects adsorption", "Impurities matter for catalysis"],
      linkedReagents: ["aluminum-isopropoxide"],
      evidenceLevel: "Report phase, surface area, pore structure and pretreatment."
    },
    {
      id: "llzo",
      name: "Lithium lanthanum zirconium oxide",
      family: "Solid electrolytes",
      formula: "Li7La3Zr2O12",
      maturity: 78,
      applications: ["Solid-state batteries", "Lithium metal interfaces", "Ion-conducting ceramics"],
      properties: ["Garnet structure", "Lithium-ion conductivity", "Dense ceramic processing", "Air sensitivity of surface carbonate"],
      synthesis: "Prepared by solid-state reaction, sol-gel or tape-casting routes followed by high-temperature sintering.",
      characterization: ["XRD cubic/tetragonal phase", "EIS ionic conductivity", "SEM density", "XPS surface carbonate"],
      limitations: ["Densification controls conductivity", "Li loss during sintering matters", "Interface resistance dominates cell claims"],
      linkedReagents: ["lithium-carbonate"],
      evidenceLevel: "Battery electrolyte claims need phase, density, conductivity and interface protocol."
    },
    {
      id: "carbon-black",
      name: "Carbon black",
      family: "Conductive carbons",
      formula: "amorphous carbon",
      maturity: 86,
      applications: ["Battery conductive additive", "Rubber reinforcement", "Pigments", "Catalyst supports"],
      properties: ["Aggregate structure", "Conductive network formation", "High surface area", "Surface oxygen variation"],
      synthesis: "Industrial incomplete-combustion material with grade-specific particle and aggregate structure.",
      characterization: ["BET area", "DBP absorption", "TEM aggregate morphology", "Raman disorder"],
      limitations: ["Grade matters", "Loading and dispersion dominate conductivity", "Surface chemistry can affect electrochemistry"],
      linkedReagents: ["graphite-oxide"],
      evidenceLevel: "State grade, surface area, loading and dispersion method."
    }
  ]);

  addUnique(data.routes, [
    { id: "styrene-polymerization", start: "Styrene", target: "Polystyrene", route: ["AIBN initiation", "Radical propagation", "Termination"], note: "Polymerization claims need conversion, molecular weight and inhibitor history." },
    { id: "mma-polymerization", start: "Methyl methacrylate", target: "PMMA", route: ["Radical initiation", "Chain growth", "Purification"], note: "Optical and mechanical claims depend on molecular weight and residual monomer." },
    { id: "alkene-epoxidation", start: "Alkene", target: "Epoxide", route: ["mCPBA oxygen transfer", "Concerted epoxidation"], note: "Stereospecificity follows alkene geometry in many peracid epoxidations." },
    { id: "acid-to-acid-chloride", start: "Carboxylic acid", target: "Acid chloride", route: ["SOCl2 or oxalyl chloride activation", "Gas evolution"], note: "Moisture exclusion and substrate sensitivity determine practical success." },
    { id: "ketone-thionation", start: "Carbonyl", target: "Thiocarbonyl", route: ["Lawesson reagent", "Sulfur transfer"], note: "Thionation should be supported by diagnostic spectroscopy or reference comparison." }
  ]);

  addUnique(data.concepts, [
    {
      id: "compound-identity",
      term: "Compound identity record",
      family: "Data provenance",
      equation: "name + identifier + structure + source link -> citable identity",
      definition: "A local chemistry record that distinguishes human-readable names from machine identifiers such as CID, InChIKey, SMILES and CAS number.",
      academicUse: "Use it before comparing literature, spectra or safety data for a compound with multiple synonyms.",
      evidenceNote: "At least one public identifier and a source link should be retained for reproducibility.",
      sourceRefs: ["pubchem", "iupac-goldbook"]
    },
    {
      id: "live-metadata-import",
      term: "Live metadata import",
      family: "Research informatics",
      equation: "local miss -> external query -> structured source card",
      definition: "A workflow where a static research site requests public scholarly metadata and renders source-linked cards without copying restricted full text.",
      academicUse: "Use it to keep local notes concise while preserving traceability to NIH/NLM and PubChem records.",
      evidenceNote: "Imported metadata is a discovery layer, not a substitute for reading the original source.",
      sourceRefs: ["pubchem", "pubmed"]
    }
  ]);

  addUnique(data.reagents, [
    {
      id: "swern-system",
      name: "Swern oxidation system",
      formula: "DMSO/(COCl)2/Et3N",
      category: "Oxidation",
      risk: "corrosive",
      focus: "Low-temperature alcohol oxidation",
      tags: ["Swern", "DMSO", "alcohol", "aldehyde"],
      transformations: ["Primary alcohol to aldehyde", "Secondary alcohol to ketone"],
      conditions: ["Low temperature", "Dry solvent", "Base quench after activation"],
      scope: "Useful when chromium oxidants are undesirable and acid-sensitive substrates are tolerated.",
      mechanism: "Activated DMSO forms an alkoxysulfonium intermediate followed by base-promoted elimination.",
      traps: ["Temperature control is important", "Dimethyl sulfide odor and gas evolution require planning"],
      safety: "Corrosive activator and malodorous byproducts. Use a hood and trained procedure."
    },
    {
      id: "tpap-nmo",
      name: "TPAP/NMO",
      formula: "Pr4N[RuO4]/NMO",
      category: "Oxidation",
      risk: "oxidizer",
      focus: "Catalytic alcohol oxidation",
      tags: ["ruthenium", "oxidation", "alcohol", "catalytic"],
      transformations: ["Primary alcohol to aldehyde", "Secondary alcohol to ketone"],
      conditions: ["Catalytic TPAP with NMO co-oxidant", "Molecular sieves often used"],
      scope: "Mild catalytic oxidation system for alcohols where substrate compatibility is favorable.",
      mechanism: "Ruthenium oxo species oxidizes alcohol and is regenerated by NMO.",
      traps: ["Water and substrate coordination affect outcome", "Procedure-specific loading matters"],
      safety: "Oxidizing system with heavy-metal catalyst. Follow waste controls."
    },
    {
      id: "dast",
      name: "DAST",
      formula: "Et2NSF3",
      category: "Fluorination",
      risk: "corrosive",
      focus: "Alcohol and carbonyl fluorination",
      tags: ["fluorination", "alcohol", "deoxyfluorination", "sulfur"],
      transformations: ["Alcohol to alkyl fluoride", "Carbonyl to gem-difluoride in selected cases"],
      conditions: ["Dry solvent", "Low-temperature addition frequently used"],
      scope: "Common deoxyfluorinating reagent for introducing C-F bonds under controlled conditions.",
      mechanism: "Sulfur-fluoride activation followed by substitution or fluorination pathway.",
      traps: ["Elimination and rearrangement can compete", "Thermal instability requires caution"],
      safety: "Reactive fluorinating reagent. Avoid heating and incompatible nucleophiles."
    },
    {
      id: "cdi",
      name: "Carbonyldiimidazole",
      formula: "CDI",
      category: "Coupling",
      risk: "standard",
      focus: "Carbonyl activation",
      tags: ["coupling", "imidazole", "amide", "carbonate"],
      transformations: ["Carboxylic acid to imidazolide", "Alcohol to carbonate derivative", "Amine to urea derivative"],
      conditions: ["Aprotic solvent", "Addition of nucleophile after activation"],
      scope: "Useful activating reagent where imidazole byproduct is operationally convenient.",
      mechanism: "Nucleophilic acyl substitution at activated carbonyl intermediate.",
      traps: ["Moisture consumes reagent", "Hindered acids or amines may need optimization"],
      safety: "Moisture-reactive irritant. Use standard dry handling."
    },
    {
      id: "pybop",
      name: "PyBOP",
      formula: "C18H28F6N6OP2",
      category: "Coupling",
      risk: "standard",
      focus: "Peptide and amide coupling",
      tags: ["amide", "peptide", "coupling", "phosphonium"],
      transformations: ["Carboxylic acid plus amine to amide", "Peptide bond formation"],
      conditions: ["Base such as DIPEA", "Polar aprotic solvent"],
      scope: "Phosphonium coupling reagent used for amide-bond formation with reduced racemization in many peptide contexts.",
      mechanism: "Carboxylate activation followed by amine attack and phosphonium byproduct formation.",
      traps: ["Not automatically racemization-free", "Base and additive choice matters"],
      safety: "Consult SDS and peptide-coupling waste procedures."
    },
    {
      id: "hobt",
      name: "1-Hydroxybenzotriazole",
      formula: "HOBt",
      category: "Coupling additive",
      risk: "energetic",
      focus: "Amide coupling additive",
      tags: ["amide", "peptide", "additive", "racemization"],
      transformations: ["Activated ester formation", "Racemization suppression in selected peptide couplings"],
      conditions: ["Used with carbodiimide or phosphonium coupling systems"],
      scope: "Additive for amide coupling that changes leaving-group and side-reaction profile.",
      mechanism: "Forms benzotriazolyl ester intermediate with improved aminolysis behavior.",
      traps: ["Hydration state and handling form matter", "Dry material may be energetic"],
      safety: "Potential energetic hazard when dry. Follow supplier and institutional controls."
    },
    {
      id: "khmds",
      name: "Potassium bis(trimethylsilyl)amide",
      formula: "KHMDS",
      category: "Base",
      risk: "dry",
      focus: "Strong hindered base",
      tags: ["base", "enolate", "amide base", "potassium"],
      transformations: ["Enolate formation", "Deprotonation of weakly acidic substrates"],
      conditions: ["Dry THF or hydrocarbon solvent", "Temperature controls aggregation and selectivity"],
      scope: "Strong non-nucleophilic base with cation effects distinct from lithium analogues.",
      mechanism: "Sterically hindered amide abstracts acidic proton; counterion changes aggregation and reactivity.",
      traps: ["Cation effects can change E/Z enolate ratio", "Moisture destroys reagent"],
      safety: "Strong base, moisture-sensitive solution or solid."
    },
    {
      id: "sodium-azide",
      name: "Sodium azide",
      formula: "NaN3",
      category: "Nucleophile",
      risk: "toxic",
      focus: "Azide substitution and click precursor synthesis",
      tags: ["azide", "nucleophile", "SN2", "click chemistry"],
      transformations: ["Alkyl halide to alkyl azide", "Acyl derivative to acyl azide in selected workflows"],
      conditions: ["Polar aprotic solvent often supports substitution", "Avoid acid and heavy metals"],
      scope: "Useful azide source for substitution and downstream triazole or amine routes.",
      mechanism: "Azide anion acts as nucleophile in substitution or acyl transfer chemistry.",
      traps: ["Hydrazoic acid formation is dangerous", "Heavy-metal azides can be explosive"],
      safety: "Highly toxic and potentially explosive with incompatible metals/acids."
    },
    {
      id: "ad-mix-alpha",
      name: "AD-mix-alpha",
      formula: "Os catalyst/K3Fe(CN)6/K2CO3/ligand",
      category: "Asymmetric oxidation",
      risk: "toxic",
      focus: "Sharpless asymmetric dihydroxylation",
      tags: ["asymmetric", "dihydroxylation", "alkene", "osmium"],
      transformations: ["Alkene to enantioenriched vicinal diol"],
      conditions: ["Biphasic tert-butanol/water often used", "Ligand set controls facial selectivity"],
      scope: "Packaged asymmetric dihydroxylation system for many alkenes.",
      mechanism: "Osmium-catalyzed syn dihydroxylation with chiral ligand-controlled approach.",
      traps: ["Mnemonic selectivity rules need substrate-specific confirmation", "Osmium toxicity dominates risk"],
      safety: "Contains toxic osmium species. Follow specialized waste controls."
    },
    {
      id: "triphosgene",
      name: "Triphosgene",
      formula: "C3Cl6O3",
      category: "Carbonylation",
      risk: "toxic",
      focus: "Phosgene-equivalent carbonyl transfer",
      tags: ["carbonylation", "chloroformate", "carbonate", "isocyanate"],
      transformations: ["Alcohol to chloroformate or carbonate", "Amine to isocyanate or carbamate in selected workflows"],
      conditions: ["Base and dry solvent", "Controlled addition and ventilation"],
      scope: "Solid phosgene equivalent used for carbonyl-transfer chemistry.",
      mechanism: "Thermal or nucleophile-triggered generation of reactive carbonyl chloride equivalents.",
      traps: ["Can release phosgene", "Stoichiometry and base control product class"],
      safety: "Highly toxic phosgene-equivalent. Requires strict controls."
    }
  ]);

  addUnique(data.compounds, [
    {
      id: "naphthalene",
      name: "Naphthalene",
      formula: "C10H8",
      cas: "91-20-3",
      family: "Polycyclic aromatic hydrocarbon",
      synonyms: ["bicyclic aromatic hydrocarbon"],
      summary: "Fused aromatic system used in aromaticity, electrophilic substitution and environmental chemistry examples.",
      evidenceNote: "Environmental or toxicology claims should be linked to source-specific exposure context.",
      tags: ["PAH", "aromatic", "environmental"]
    },
    {
      id: "anisole",
      name: "Anisole",
      formula: "C7H8O",
      cas: "100-66-3",
      family: "Aryl ether",
      synonyms: ["methoxybenzene"],
      summary: "Electron-rich arene used for directing-effect and electrophilic aromatic substitution cases.",
      evidenceNote: "Regioselectivity claims should state electrophile, solvent and temperature.",
      tags: ["aromatic", "ether", "EAS"]
    },
    {
      id: "nitrobenzene",
      name: "Nitrobenzene",
      formula: "C6H5NO2",
      cas: "98-95-3",
      family: "Nitroarene",
      synonyms: ["nitrobenzol"],
      summary: "Electron-poor arene linking reduction chemistry, spectroscopy and directing effects.",
      evidenceNote: "Reduction claims require reagent and stopping point because nitroso, hydroxylamine and aniline states can intervene.",
      tags: ["nitro", "aromatic", "reduction"]
    },
    {
      id: "ethyl-acetate",
      name: "Ethyl acetate",
      formula: "C4H8O2",
      cas: "141-78-6",
      family: "Ester solvent",
      synonyms: ["EtOAc"],
      summary: "Common extraction and chromatography solvent with ester hydrolysis relevance.",
      evidenceNote: "Solvent purity and water content can affect extraction or reaction claims.",
      tags: ["solvent", "ester", "chromatography"]
    },
    {
      id: "triethylamine",
      name: "Triethylamine",
      formula: "C6H15N",
      cas: "121-44-8",
      family: "Tertiary amine base",
      synonyms: ["Et3N", "TEA"],
      summary: "Organic base used in acylation, sulfonylation and salt-scavenging operations.",
      evidenceNote: "Base equivalence and salt precipitation are operational variables in method transfer.",
      tags: ["base", "amine", "coupling"]
    }
  ]);

  mergeUnique(data.compounds, [
    { id: "methanol", name: "Methanol", formula: "CH4O", family: "Solvent", synonyms: ["methanol"], summary: "Methanol local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "solvent"], hazardStatements: ["H225: Highly Flammable liquid and vapor [Danger Flammable liquids]", "H301: Toxic if swallowed [Danger Acute toxicity, oral]", "H311: Toxic in contact with skin [Danger Acute toxicity, dermal]", "H331: Toxic if inhaled [Danger Acute toxicity, inhalation]", "H370 **: Causes damage to organs [Danger Specific target organ toxicity, single exposure]"], hazardLevel: "Severe", signalWord: "Danger", precautionaryStatements: ["P210, P233, P240, P241, P242, P243, P260, P261, P262, P264, P270, P271, P280, P301+P316, P302+P352, P303+P361+P353, P304+P340, P308+P316, P316, P321, P330, P361+P364, P370+P378, P403+P233, P403+P235, P405, and P501"], disposalMethod: "Collect as hazardous toxic/reactive waste; keep segregated and route through institutional EHS or a licensed hazardous-waste contractor.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/887", raw: { source: "PubChem", cid: "887", safetySeededAt: "2026-05-29" } },
    { id: "ethanol", name: "Ethanol", formula: "C2H6O", family: "Solvent", synonyms: ["ethanol"], summary: "Ethanol local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "solvent"], hazardStatements: ["H225: Highly Flammable liquid and vapor [Danger Flammable liquids]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P210, P233, P240, P241, P242, P243, P280, P303+P361+P353, P370+P378, P403+P235, and P501"], disposalMethod: "Collect in a compatible flammable organic-waste container with ignition sources excluded; do not pour to drain.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/702", raw: { source: "PubChem", cid: "702", safetySeededAt: "2026-05-29" } },
    { id: "acetone", name: "Acetone", formula: "C3H6O", family: "Solvent", synonyms: ["acetone"], summary: "Acetone local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "solvent"], hazardStatements: ["H225: Highly Flammable liquid and vapor [Danger Flammable liquids]", "H319: Causes serious eye irritation [Warning Serious eye damage/eye irritation]", "H336: May cause drowsiness or dizziness [Warning Specific target organ toxicity, single exposure; Narcotic effects]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P210, P233, P240, P241, P242, P243, P261, P264+P265, P271, P280, P303+P361+P353, P304+P340, P305+P351+P338, P319, P337+P317, P370+P378, P403+P233, P403+P235, P405, and P501"], disposalMethod: "Collect in a compatible flammable organic-waste container with ignition sources excluded; do not pour to drain.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/180", raw: { source: "PubChem", cid: "180", safetySeededAt: "2026-05-29" } },
    { id: "diethyl-ether", name: "Diethyl Ether", formula: "C4H10O", family: "Ether solvent", synonyms: ["diethyl ether"], summary: "Diethyl ether local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "ether solvent"], hazardStatements: ["H224: Extremely flammable liquid and vapor [Danger Flammable liquids]", "H302: Harmful if swallowed [Warning Acute toxicity, oral]", "H336: May cause drowsiness or dizziness [Warning Specific target organ toxicity, single exposure; Narcotic effects]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P210, P233, P240, P241, P242, P243, P261, P264, P270, P271, P280, P301+P317, P303+P361+P353, P304+P340, P319, P330, P370+P378, P403+P233, P403+P235, P405, and P501"], disposalMethod: "Collect in peroxide-former or flammable organic waste as locally required; keep away from ignition sources and do not pour to drain.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/3283", raw: { source: "PubChem", cid: "3283", safetySeededAt: "2026-05-29" } },
    { id: "toluene", name: "Toluene", formula: "C7H8", family: "Solvent", synonyms: ["toluene"], summary: "Toluene local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "solvent"], hazardStatements: ["H225: Highly Flammable liquid and vapor [Danger Flammable liquids]", "H304: May be fatal if swallowed and enters airways [Danger Aspiration hazard]", "H315: Causes skin irritation [Warning Skin corrosion/irritation]", "H336: May cause drowsiness or dizziness [Warning Specific target organ toxicity, single exposure; Narcotic effects]", "H361d ***: Suspected of damaging the unborn child [Warning Reproductive toxicity]", "H373 **: May causes damage to organs through prolonged or repeated exposure [Warning Specific target organ toxicity, repeated exposure]"], hazardLevel: "Severe", signalWord: "Danger", precautionaryStatements: ["P203, P210, P233, P240, P241, P242, P243, P260, P261, P264, P271, P280, P301+P316, P302+P352, P303+P361+P353, P304+P340, P318, P319, P321, P331, P332+P317, P362+P364, P370+P378, P403+P233, P403+P235, P405, and P501"], disposalMethod: "Collect as hazardous flammable organic waste; segregate from oxidizers and route through institutional hazardous-waste disposal.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/1140", raw: { source: "PubChem", cid: "1140", safetySeededAt: "2026-05-29" } },
    { id: "dichloromethane", name: "Dichloromethane", formula: "CH2Cl2", family: "Halogenated solvent", synonyms: ["methylene chloride"], summary: "Dichloromethane local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "halogenated solvent"], hazardStatements: ["H351: Suspected of causing cancer [Warning Carcinogenicity]"], hazardLevel: "Severe", signalWord: "Warning", precautionaryStatements: ["P203, P280, P318, P405, and P501"], disposalMethod: "Collect as halogenated hazardous solvent waste; keep separate from non-halogenated flammable waste unless local EHS directs otherwise.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/6344", raw: { source: "PubChem", cid: "6344", safetySeededAt: "2026-05-29" } },
    { id: "chloroform", name: "Chloroform", formula: "CHCl3", family: "Halogenated solvent", synonyms: ["trichloromethane"], summary: "Chloroform local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "halogenated solvent"], hazardStatements: ["H302: Harmful if swallowed [Warning Acute toxicity, oral]", "H315: Causes skin irritation [Warning Skin corrosion/irritation]", "H319: Causes serious eye irritation [Warning Serious eye damage/eye irritation]", "H331: Toxic if inhaled [Danger Acute toxicity, inhalation]", "H351: Suspected of causing cancer [Warning Carcinogenicity]", "H361d: Suspected of damaging the unborn child [Warning Reproductive toxicity]"], hazardLevel: "Severe", signalWord: "Danger", precautionaryStatements: ["P203, P260, P261, P264, P264+P265, P270, P271, P280, P301+P317, P302+P352, P304+P340, P305+P351+P338, P316, P318, P319, P321, P330, P332+P317, P337+P317, P362+P364, P403+P233, P405, and P501"], disposalMethod: "Collect as halogenated toxic solvent waste in a compatible closed container; do not pour to drain.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/6212", raw: { source: "PubChem", cid: "6212", safetySeededAt: "2026-05-29" } },
    { id: "hexane", name: "Hexane", formula: "C6H14", family: "Solvent", synonyms: ["n-hexane"], summary: "Hexane local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "solvent"], hazardStatements: ["H225: Highly Flammable liquid and vapor [Danger Flammable liquids]", "H304: May be fatal if swallowed and enters airways [Danger Aspiration hazard]", "H315: Causes skin irritation [Warning Skin corrosion/irritation]", "H336: May cause drowsiness or dizziness [Warning Specific target organ toxicity, single exposure; Narcotic effects]", "H361f ***: Suspected of damaging fertility [Warning Reproductive toxicity]", "H372: Causes damage to organs through prolonged or repeated exposure [Danger Specific target organ toxicity, repeated exposure]"], hazardLevel: "Severe", signalWord: "Danger", precautionaryStatements: ["P203, P210, P233, P240, P241, P242, P243, P260, P261, P264, P270, P271, P273, P280, P301+P316, P302+P352, P303+P361+P353, P304+P340, P318, P319, P321, P331, P332+P317, P362+P364, P370+P378, P391, P403+P233, P403+P235, P405, and P501"], disposalMethod: "Collect as hazardous flammable organic waste; prevent drain release and segregate from oxidizers.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/8058", raw: { source: "PubChem", cid: "8058", safetySeededAt: "2026-05-29" } },
    { id: "benzene", name: "Benzene", formula: "C6H6", family: "Aromatic solvent", synonyms: ["benzol"], summary: "Benzene local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "aromatic"], hazardStatements: ["H225: Highly Flammable liquid and vapor [Danger Flammable liquids]", "H304: May be fatal if swallowed and enters airways [Danger Aspiration hazard]", "H315: Causes skin irritation [Warning Skin corrosion/irritation]", "H319: Causes serious eye irritation [Warning Serious eye damage/eye irritation]", "H340: May cause genetic defects [Danger Germ cell mutagenicity]", "H350: May cause cancer [Danger Carcinogenicity]"], hazardLevel: "Severe", signalWord: "Danger", precautionaryStatements: ["P203, P210, P233, P240, P241, P242, P243, P260, P264, P264+P265, P270, P280, P301+P316, P302+P352, P303+P361+P353, P305+P351+P338, P318, P319, P321, P331, P332+P317, P337+P317, P362+P364, P370+P378, P403+P235, P405, and P501"], disposalMethod: "Collect as hazardous carcinogenic flammable solvent waste in a clearly labelled compatible container.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/241", raw: { source: "PubChem", cid: "241", safetySeededAt: "2026-05-29" } },
    { id: "phenol", name: "Phenol", formula: "C6H6O", family: "Phenol", synonyms: ["carbolic acid"], summary: "Phenol local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "phenol"], hazardStatements: ["H301: Toxic if swallowed [Danger Acute toxicity, oral]", "H311: Toxic in contact with skin [Danger Acute toxicity, dermal]", "H314: Causes severe skin burns and eye damage [Danger Skin corrosion/irritation]", "H331: Toxic if inhaled [Danger Acute toxicity, inhalation]", "H341: Suspected of causing genetic defects [Warning Germ cell mutagenicity]", "H373 **: May causes damage to organs through prolonged or repeated exposure [Warning Specific target organ toxicity, repeated exposure]"], hazardLevel: "Severe", signalWord: "Danger", precautionaryStatements: ["P203, P260, P261, P262, P264, P270, P271, P280, P301+P316, P301+P330+P331, P302+P352, P302+P361+P354, P304+P340, P305+P354+P338, P316, P318, P319, P321, P330, P361+P364, P363, P403+P233, P405, and P501"], disposalMethod: "Collect as toxic corrosive organic waste; keep segregated and route through institutional hazardous-waste disposal.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/996", raw: { source: "PubChem", cid: "996", safetySeededAt: "2026-05-29" } },
    { id: "formaldehyde", name: "Formaldehyde", formula: "CH2O", family: "Aldehyde", synonyms: ["methanal", "formalin"], summary: "Formaldehyde local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "aldehyde"], hazardStatements: ["H302: Harmful if swallowed [Warning Acute toxicity, oral]", "H314: Causes severe skin burns and eye damage [Danger Skin corrosion/irritation]", "H317: May cause an allergic skin reaction [Warning Sensitization, Skin]", "H330: Fatal if inhaled [Danger Acute toxicity, inhalation]", "H341: Suspected of causing genetic defects [Warning Germ cell mutagenicity]", "H350: May cause cancer [Danger Carcinogenicity]"], hazardLevel: "Severe", signalWord: "Danger", precautionaryStatements: ["P203, P260, P261, P264, P270, P271, P272, P280, P284, P301+P317, P301+P330+P331, P302+P352, P302+P361+P354, P304+P340, P305+P354+P338, P316, P318, P320, P321, P330, P333+P317, P362+P364, P363, P403+P233, P405, and P501"], disposalMethod: "Collect as toxic aldehyde waste; route through institutional hazardous-waste disposal and do not drain-dispose.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/712", raw: { source: "PubChem", cid: "712", safetySeededAt: "2026-05-29" } },
    { id: "hydrochloric-acid", name: "Hydrochloric Acid", formula: "ClH", family: "Acid", synonyms: ["hydrogen chloride"], summary: "Hydrochloric acid local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "acid"], hazardStatements: ["H314: Causes severe skin burns and eye damage [Danger Skin corrosion/irritation]", "H331: Toxic if inhaled [Danger Acute toxicity, inhalation]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P260, P261, P264, P271, P280, P301+P330+P331, P302+P361+P354, P304+P340, P305+P354+P338, P316, P321, P363, P403+P233, P405, and P501"], disposalMethod: "Collect as corrosive acid waste or neutralize only under an approved institutional procedure; keep bases and incompatible metals separate.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/313", raw: { source: "PubChem", cid: "313", safetySeededAt: "2026-05-29" } },
    { id: "sulfuric-acid", name: "Sulfuric Acid", formula: "H2O4S", family: "Acid", synonyms: ["oil of vitriol"], summary: "Sulfuric acid local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "acid"], hazardStatements: ["H314: Causes severe skin burns and eye damage [Danger Skin corrosion/irritation]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P260, P264, P280, P301+P330+P331, P302+P361+P354, P304+P340, P305+P354+P338, P316, P321, P363, P405, and P501"], disposalMethod: "Collect as corrosive acid waste; neutralize only under approved EHS procedures and never mix with incompatible organic or base waste.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/1118", raw: { source: "PubChem", cid: "1118", safetySeededAt: "2026-05-29" } },
    { id: "nitric-acid", name: "Nitric Acid", formula: "HNO3", family: "Acid oxidizer", synonyms: ["aqua fortis"], summary: "Nitric acid local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "acid", "oxidizer"], hazardStatements: ["H272: May intensify fire; oxidizer [Danger Oxidizing liquids; Oxidizing solids]", "H314: Causes severe skin burns and eye damage [Danger Skin corrosion/irritation]", "H330: Fatal if inhaled [Danger Acute toxicity, inhalation]"], hazardLevel: "Severe", signalWord: "Danger", precautionaryStatements: ["P210, P220, P260, P264, P271, P280, P284, P301+P330+P331, P302+P361+P354, P304+P340, P305+P354+P338, P316, P320, P321, P363, P370+P378, P403+P233, P405, and P501"], disposalMethod: "Collect as oxidizing corrosive acid waste; keep separate from organic solvents, reducers and bases unless EHS directs otherwise.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/944", raw: { source: "PubChem", cid: "944", safetySeededAt: "2026-05-29" } },
    { id: "acetic-acid", name: "Acetic Acid", formula: "C2H4O2", family: "Carboxylic acid", synonyms: ["ethanoic acid"], summary: "Acetic acid local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "acid"], hazardStatements: ["H226: Flammable liquid and vapor [Warning Flammable liquids]", "H314: Causes severe skin burns and eye damage [Danger Skin corrosion/irritation]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P210, P233, P240, P241, P242, P243, P260, P264, P280, P301+P330+P331, P302+P361+P354, P303+P361+P353, P304+P340, P305+P354+P338, P316, P321, P363, P370+P378, P403+P235, P405, and P501"], disposalMethod: "Collect as corrosive flammable organic acid waste; do not combine with incompatible oxidizers or bases without approved procedure.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/176", raw: { source: "PubChem", cid: "176", safetySeededAt: "2026-05-29" } },
    { id: "sodium-hydroxide", name: "Sodium Hydroxide", formula: "HNaO", family: "Base", synonyms: ["caustic soda"], summary: "Sodium hydroxide local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "base"], hazardStatements: ["H314: Causes severe skin burns and eye damage [Danger Skin corrosion/irritation]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P260, P264, P280, P301+P330+P331, P302+P361+P354, P304+P340, P305+P354+P338, P316, P321, P363, P405, and P501"], disposalMethod: "Collect as corrosive caustic waste or neutralize only under approved institutional procedure; segregate from acids and reactive metals.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/14798", raw: { source: "PubChem", cid: "14798", safetySeededAt: "2026-05-29" } },
    { id: "ammonia", name: "Ammonia", formula: "H3N", family: "Base", synonyms: ["ammonia"], summary: "Ammonia local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "base"], hazardStatements: ["H221: Flammable gas [Danger Flammable gases]", "H314: Causes severe skin burns and eye damage [Danger Skin corrosion/irritation]", "H331: Toxic if inhaled [Danger Acute toxicity, inhalation]", "H400: Very toxic to aquatic life [Warning Hazardous to the aquatic environment, acute hazard]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P210, P260, P261, P264, P271, P273, P280, P301+P330+P331, P302+P361+P354, P304+P340, P305+P354+P338, P316, P321, P363, P377, P381, P391, P403, P403+P233, P405, and P501"], disposalMethod: "Collect as corrosive/toxic basic waste; prevent release to drains or environment and follow EHS container guidance.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/222", raw: { source: "PubChem", cid: "222", safetySeededAt: "2026-05-29" } },
    { id: "hydrogen-peroxide", name: "Hydrogen Peroxide", formula: "H2O2", family: "Oxidizer", synonyms: ["peroxide"], summary: "Hydrogen peroxide local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "oxidizer"], hazardStatements: ["H271: May cause fire or explosion; strong Oxidizer [Danger Oxidizing liquids; Oxidizing solids]", "H302: Harmful if swallowed [Warning Acute toxicity, oral]", "H314: Causes severe skin burns and eye damage [Danger Skin corrosion/irritation]", "H332: Harmful if inhaled [Warning Acute toxicity, inhalation]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P210, P220, P260, P261, P264, P270, P271, P280, P283, P301+P317, P301+P330+P331, P302+P361+P354, P304+P340, P305+P354+P338, P306+P360, P316, P317, P321, P330, P363, P370+P378, P371+P380+P375, P405, P420, and P501"], disposalMethod: "Collect as oxidizing corrosive waste unless concentration-specific EHS procedures allow controlled decomposition; keep away from organics/reducers.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/784", raw: { source: "PubChem", cid: "784", safetySeededAt: "2026-05-29" } },
    { id: "sodium-hypochlorite", name: "Sodium Hypochlorite", formula: "ClNaO", family: "Oxidizer", synonyms: ["bleach"], summary: "Sodium hypochlorite local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "oxidizer"], hazardStatements: ["H314: Causes severe skin burns and eye damage [Danger Skin corrosion/irritation]", "H318: Causes serious eye damage [Danger Serious eye damage/eye irritation]", "H400: Very toxic to aquatic life [Warning Hazardous to the aquatic environment, acute hazard]", "H410: Very toxic to aquatic life with long lasting effects [Warning Hazardous to the aquatic environment, long-term hazard]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P260, P264, P264+P265, P273, P280, P301+P330+P331, P302+P361+P354, P304+P340, P305+P354+P338, P316, P317, P321, P363, P391, P405, and P501"], disposalMethod: "Collect as oxidizing alkaline waste; never mix with acids or ammonia and follow institutional disposal guidance.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/23665760", raw: { source: "PubChem", cid: "23665760", safetySeededAt: "2026-05-29" } },
    { id: "iodine", name: "Iodine", formula: "I2", family: "Halogen", synonyms: ["iodine"], summary: "Iodine local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "halogen"], hazardStatements: ["H312: Harmful in contact with skin [Warning Acute toxicity, dermal]", "H332: Harmful if inhaled [Warning Acute toxicity, inhalation]", "H400: Very toxic to aquatic life [Warning Hazardous to the aquatic environment, acute hazard]"], hazardLevel: "High", signalWord: "Warning", precautionaryStatements: ["P261, P271, P273, P280, P302+P352, P304+P340, P317, P321, P362+P364, P391, and P501"], disposalMethod: "Collect as halogen/toxic hazardous waste; prevent drain release and segregate from reducers and incompatible metals.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/807", raw: { source: "PubChem", cid: "807", safetySeededAt: "2026-05-29" } },
    { id: "aniline", name: "Aniline", formula: "C6H7N", family: "Aromatic amine", synonyms: ["benzenamine"], summary: "Aniline local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "aromatic amine"], hazardStatements: ["H301: Toxic if swallowed [Danger Acute toxicity, oral]", "H311: Toxic in contact with skin [Danger Acute toxicity, dermal]", "H317: May cause an allergic skin reaction [Warning Sensitization, Skin]", "H318: Causes serious eye damage [Danger Serious eye damage/eye irritation]", "H331: Toxic if inhaled [Danger Acute toxicity, inhalation]", "H341: Suspected of causing genetic defects [Warning Germ cell mutagenicity]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P203, P260, P261, P262, P264, P264+P265, P270, P271, P272, P273, P280, P301+P316, P302+P352, P304+P340, P305+P354+P338, P316, P317, P318, P319, P321, P330, P333+P317, P361+P364, P362+P364, P391, P403+P233, P405, and P501"], disposalMethod: "Collect as toxic aromatic amine waste; route through institutional hazardous-waste disposal.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/6115", raw: { source: "PubChem", cid: "6115", safetySeededAt: "2026-05-29" } },
    { id: "nitrobenzene", name: "Nitrobenzene", formula: "C6H5NO2", family: "Nitroarene", synonyms: ["nitrobenzol"], summary: "Nitrobenzene local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "nitroarene"], hazardStatements: ["H301: Toxic if swallowed [Danger Acute toxicity, oral]", "H311: Toxic in contact with skin [Danger Acute toxicity, dermal]", "H331: Toxic if inhaled [Danger Acute toxicity, inhalation]", "H351: Suspected of causing cancer [Warning Carcinogenicity]", "H360F: May damage fertility [Danger Reproductive toxicity]", "H372: Causes damage to organs through prolonged or repeated exposure [Danger Specific target organ toxicity, repeated exposure]"], hazardLevel: "Severe", signalWord: "Danger", precautionaryStatements: ["P203, P260, P261, P262, P264, P270, P271, P273, P280, P301+P316, P302+P352, P304+P340, P316, P318, P319, P321, P330, P361+P364, P403+P233, P405, and P501"], disposalMethod: "Collect as toxic nitroaromatic waste; prevent drain release and route through institutional hazardous-waste disposal.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/7416", raw: { source: "PubChem", cid: "7416", safetySeededAt: "2026-05-29" } },
    { id: "styrene", name: "Styrene", formula: "C8H8", family: "Vinyl arene", synonyms: ["ethenylbenzene"], summary: "Styrene local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "vinyl arene"], hazardStatements: ["H226: Flammable liquid and vapor [Warning Flammable liquids]", "H315: Causes skin irritation [Warning Skin corrosion/irritation]", "H319: Causes serious eye irritation [Warning Serious eye damage/eye irritation]", "H332: Harmful if inhaled [Warning Acute toxicity, inhalation]", "H361d: Suspected of damaging the unborn child [Warning Reproductive toxicity]", "H372: Causes damage to organs through prolonged or repeated exposure [Danger Specific target organ toxicity, repeated exposure]"], hazardLevel: "Severe", signalWord: "Danger", precautionaryStatements: ["P203, P210, P233, P240, P241, P242, P243, P260, P261, P264, P264+P265, P270, P271, P280, P302+P352, P303+P361+P353, P304+P340, P305+P351+P338, P317, P318, P319, P321, P332+P317, P337+P317, P362+P364, P370+P378, P403+P235, P405, and P501"], disposalMethod: "Collect as hazardous polymerizable flammable organic waste; keep inhibitor and storage status visible where relevant.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/7501", raw: { source: "PubChem", cid: "7501", safetySeededAt: "2026-05-29" } },
    { id: "naphthalene", name: "Naphthalene", formula: "C10H8", family: "Polycyclic aromatic hydrocarbon", synonyms: ["bicyclic aromatic hydrocarbon"], summary: "Naphthalene local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "PAH"], hazardStatements: ["H302: Harmful if swallowed [Warning Acute toxicity, oral]", "H351: Suspected of causing cancer [Warning Carcinogenicity]", "H400: Very toxic to aquatic life [Warning Hazardous to the aquatic environment, acute hazard]", "H410: Very toxic to aquatic life with long lasting effects [Warning Hazardous to the aquatic environment, long-term hazard]"], hazardLevel: "Severe", signalWord: "Warning", precautionaryStatements: ["P203, P264, P270, P273, P280, P301+P317, P318, P330, P391, P405, and P501"], disposalMethod: "Collect as hazardous PAH/environmental waste; prevent drain release and route through approved disposal.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/931", raw: { source: "PubChem", cid: "931", safetySeededAt: "2026-05-29" } }
  ]);

  mergeUnique(data.compounds, [
    { id: "acetonitrile", name: "Acetonitrile", formula: "C2H3N", family: "Solvent", synonyms: [], summary: "Acetonitrile local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "solvent"], hazardStatements: ["H225: Highly Flammable liquid and vapor [Danger Flammable liquids]", "H302: Harmful if swallowed [Warning Acute toxicity, oral]", "H312: Harmful in contact with skin [Warning Acute toxicity, dermal]", "H319: Causes serious eye irritation [Warning Serious eye damage/eye irritation]", "H332: Harmful if inhaled [Warning Acute toxicity, inhalation]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P210, P233, P240, P241, P242, P243, P261, P264, P264+P265, P270, P271, P280, P301+P317, P302+P352, P303+P361+P353, P304+P340, P305+P351+P338, P317, P321, P330, P337+P317, P362+P364, P370+P378, P403+P235, and P501"], disposalMethod: "Collect in a compatible flammable organic-waste container; keep segregated from oxidizers and do not pour to drain.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/6342", raw: { source: "PubChem", cid: "6342", safetySeededAt: "2026-05-29" } },
    { id: "thf", name: "Tetrahydrofuran", formula: "C4H8O", family: "Ether solvent", synonyms: ["THF"], summary: "Tetrahydrofuran local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "ether solvent"], hazardStatements: ["H225: Highly Flammable liquid and vapor [Danger Flammable liquids]", "H319: Causes serious eye irritation [Warning Serious eye damage/eye irritation]", "H335: May cause respiratory irritation [Warning Specific target organ toxicity, single exposure; Respiratory tract irritation]", "H351: Suspected of causing cancer [Warning Carcinogenicity]"], hazardLevel: "Severe", signalWord: "Danger", precautionaryStatements: ["P203, P210, P233, P240, P241, P242, P243, P261, P264+P265, P271, P280, P303+P361+P353, P304+P340, P305+P351+P338, P318, P319, P337+P317, P370+P378, P403+P233, P403+P235, P405, and P501"], disposalMethod: "Collect as peroxide-former flammable organic waste; keep ignition sources excluded and follow local peroxide-former controls.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/8028", raw: { source: "PubChem", cid: "8028", safetySeededAt: "2026-05-29" } },
    { id: "ethyl-acetate", name: "Ethyl Acetate", formula: "C4H8O2", family: "Ester solvent", synonyms: ["EtOAc"], summary: "Ethyl acetate local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "ester solvent"], hazardStatements: ["H225: Highly Flammable liquid and vapor [Danger Flammable liquids]", "H319: Causes serious eye irritation [Warning Serious eye damage/eye irritation]", "H336: May cause drowsiness or dizziness [Warning Specific target organ toxicity, single exposure; Narcotic effects]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P210, P233, P240, P241, P242, P243, P261, P264+P265, P271, P280, P303+P361+P353, P304+P340, P305+P351+P338, P319, P337+P317, P370+P378, P403+P233, P403+P235, P405, and P501"], disposalMethod: "Collect in a compatible flammable organic-waste container; do not pour to drain.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/8857", raw: { source: "PubChem", cid: "8857", safetySeededAt: "2026-05-29" } },
    { id: "triethylamine", name: "Triethylamine", formula: "C6H15N", family: "Tertiary amine base", synonyms: ["Et3N", "TEA"], summary: "Triethylamine local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "tertiary amine base"], hazardStatements: ["H225: Highly Flammable liquid and vapor [Danger Flammable liquids]", "H301: Toxic if swallowed [Danger Acute toxicity, oral]", "H311: Toxic in contact with skin [Danger Acute toxicity, dermal]", "H314: Causes severe skin burns and eye damage [Danger Skin corrosion/irritation]", "H318: Causes serious eye damage [Danger Serious eye damage/eye irritation]", "H331: Toxic if inhaled [Danger Acute toxicity, inhalation]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P210, P233, P240, P241, P242, P243, P260, P261, P262, P264, P264+P265, P270, P271, P280, P301+P316, P301+P330+P331, P302+P352, P302+P361+P354, P303+P361+P353, P304+P340, P305+P354+P338, P316, P317, P321, P330, P361+P364, P363, P370+P378, P403+P233, P403+P235, P405, and P501"], disposalMethod: "Collect as corrosive flammable organic base waste; keep acids and oxidizers segregated.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/8471", raw: { source: "PubChem", cid: "8471", safetySeededAt: "2026-05-29" } },
    { id: "dimethyl-sulfoxide", name: "Dimethyl Sulfoxide", formula: "C2H6OS", family: "Polar aprotic solvent", synonyms: ["DMSO"], summary: "Dimethyl sulfoxide local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "polar aprotic solvent"], hazardStatements: ["H315 (28.4%): Causes skin irritation [Warning Skin corrosion/irritation]", "H319 (33.6%): Causes serious eye irritation [Warning Serious eye damage/eye irritation]", "H335 (13.8%): May cause respiratory irritation [Warning Specific target organ toxicity, single exposure; Respiratory tract irritation]"], hazardLevel: "High", signalWord: "Warning", precautionaryStatements: ["P261, P264, P264+P265, P271, P280, P302+P352, P304+P340, P305+P351+P338, P319, P321, P332+P317, P337+P317, P362+P364, P403+P233, P405, and P501"], disposalMethod: "Collect through approved organic chemical-waste channels; do not drain-dispose unless institutional policy explicitly allows it.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/679", raw: { source: "PubChem", cid: "679", safetySeededAt: "2026-05-29" } },
    { id: "dimethylformamide", name: "Dimethylformamide", formula: "C3H7NO", family: "Polar aprotic solvent", synonyms: ["DMF", "N,N-dimethylformamide"], summary: "Dimethylformamide local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "polar aprotic solvent"], hazardStatements: ["H312: Harmful in contact with skin [Warning Acute toxicity, dermal]", "H319: Causes serious eye irritation [Warning Serious eye damage/eye irritation]", "H332: Harmful if inhaled [Warning Acute toxicity, inhalation]", "H360D ***: May damage the unborn child [Danger Reproductive toxicity]"], hazardLevel: "Severe", signalWord: "Danger", precautionaryStatements: ["P203, P261, P264+P265, P271, P280, P302+P352, P304+P340, P305+P351+P338, P317, P318, P321, P337+P317, P362+P364, P405, and P501"], disposalMethod: "Collect as toxic polar aprotic solvent waste; keep segregated and route through institutional hazardous-waste disposal.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/6228", raw: { source: "PubChem", cid: "6228", safetySeededAt: "2026-05-29" } },
    { id: "pyridine", name: "Pyridine", formula: "C5H5N", family: "Heteroaromatic base", synonyms: [], summary: "Pyridine local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "heteroaromatic base"], hazardStatements: ["H225: Highly Flammable liquid and vapor [Danger Flammable liquids]", "H302: Harmful if swallowed [Warning Acute toxicity, oral]", "H312: Harmful in contact with skin [Warning Acute toxicity, dermal]", "H332: Harmful if inhaled [Warning Acute toxicity, inhalation]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P210, P233, P240, P241, P242, P243, P261, P264, P270, P271, P280, P301+P317, P302+P352, P303+P361+P353, P304+P340, P317, P321, P330, P362+P364, P370+P378, P403+P235, and P501"], disposalMethod: "Collect as flammable organic base waste; keep acids and oxidizers segregated.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/1049", raw: { source: "PubChem", cid: "1049", safetySeededAt: "2026-05-29" } },
    { id: "acetic-anhydride", name: "Acetic Anhydride", formula: "C4H6O3", family: "Acylation reagent", synonyms: [], summary: "Acetic anhydride local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "acylation reagent"], hazardStatements: ["H226: Flammable liquid and vapor [Warning Flammable liquids]", "H302: Harmful if swallowed [Warning Acute toxicity, oral]", "H314: Causes severe skin burns and eye damage [Danger Skin corrosion/irritation]", "H332: Harmful if inhaled [Warning Acute toxicity, inhalation]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P210, P233, P240, P241, P242, P243, P260, P261, P264, P270, P271, P280, P301+P317, P301+P330+P331, P302+P361+P354, P303+P361+P353, P304+P340, P305+P354+P338, P316, P317, P321, P330, P363, P370+P378, P403+P235, P405, and P501"], disposalMethod: "Collect as corrosive acylating-reagent waste; segregate from water, alcohols, bases and oxidizers.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/7918", raw: { source: "PubChem", cid: "7918", safetySeededAt: "2026-05-29" } },
    { id: "benzaldehyde", name: "Benzaldehyde", formula: "C7H6O", family: "Aldehyde", synonyms: [], summary: "Benzaldehyde local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "aldehyde"], hazardStatements: ["H302: Harmful if swallowed [Warning Acute toxicity, oral]"], hazardLevel: "Moderate", signalWord: "Warning", precautionaryStatements: ["P264, P270, P301+P317, P330, and P501"], disposalMethod: "Collect as organic hazardous waste; prevent drain release.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/240", raw: { source: "PubChem", cid: "240", safetySeededAt: "2026-05-29" } },
    { id: "benzoic-acid", name: "Benzoic Acid", formula: "C7H6O2", family: "Carboxylic acid", synonyms: [], summary: "Benzoic acid local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "carboxylic acid"], hazardStatements: ["H315: Causes skin irritation [Warning Skin corrosion/irritation]", "H318: Causes serious eye damage [Danger Serious eye damage/eye irritation]", "H372: Causes damage to organs through prolonged or repeated exposure [Danger Specific target organ toxicity, repeated exposure]"], hazardLevel: "Severe", signalWord: "Danger", precautionaryStatements: ["P260, P264, P264+P265, P270, P280, P302+P352, P305+P354+P338, P317, P319, P321, P332+P317, P362+P364, and P501"], disposalMethod: "Collect as hazardous organic acid waste unless institutional policy allows a lower-risk solid waste route after SDS review.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/243", raw: { source: "PubChem", cid: "243", safetySeededAt: "2026-05-29" } },
    { id: "sodium-chloride", name: "Sodium Chloride", formula: "ClNa", family: "Inorganic salt", synonyms: ["NaCl"], summary: "Sodium chloride local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "inorganic salt"], hazardStatements: ["H318: Causes serious eye damage [Danger Serious eye damage/eye irritation]", "H412: Harmful to aquatic life with long lasting effects [Hazardous to the aquatic environment, long-term hazard]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P264+P265, P273, P280, P305+P354+P338, P317, and P501"], disposalMethod: "Use local aqueous or solid inorganic-waste rules only after checking grade, contaminants and institutional policy.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/5234", raw: { source: "PubChem", cid: "5234", safetySeededAt: "2026-05-29" } },
    { id: "potassium-permanganate", name: "Potassium Permanganate", formula: "KMnO4", family: "Oxidizer", synonyms: ["permanganate"], summary: "Potassium permanganate local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "oxidizer"], hazardStatements: ["H272: May intensify fire; oxidizer [Danger Oxidizing liquids; Oxidizing solids]", "H302: Harmful if swallowed [Warning Acute toxicity, oral]", "H361d: Suspected of damaging the unborn child [Warning Reproductive toxicity]", "H400: Very toxic to aquatic life [Warning Hazardous to the aquatic environment, acute hazard]", "H410: Very toxic to aquatic life with long lasting effects [Warning Hazardous to the aquatic environment, long-term hazard]"], hazardLevel: "Severe", signalWord: "Danger", precautionaryStatements: ["P203, P210, P220, P264, P270, P273, P280, P301+P317, P318, P330, P370+P378, P391, P405, and P501"], disposalMethod: "Collect as oxidizing manganese-containing hazardous waste; segregate from organics, reducers and acids.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/516875", raw: { source: "PubChem", cid: "516875", safetySeededAt: "2026-05-29" } },
    { id: "copper-sulfate", name: "Copper Sulfate", formula: "CuO4S", family: "Inorganic salt", synonyms: ["cupric sulfate"], summary: "Copper sulfate local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "inorganic salt"], hazardStatements: ["H302: Harmful if swallowed [Warning Acute toxicity, oral]", "H315: Causes skin irritation [Warning Skin corrosion/irritation]", "H319: Causes serious eye irritation [Warning Serious eye damage/eye irritation]", "H400: Very toxic to aquatic life [Warning Hazardous to the aquatic environment, acute hazard]", "H410: Very toxic to aquatic life with long lasting effects [Warning Hazardous to the aquatic environment, long-term hazard]"], hazardLevel: "High", signalWord: "Warning", precautionaryStatements: ["P264, P264+P265, P270, P273, P280, P301+P317, P302+P352, P305+P351+P338, P321, P330, P332+P317, P337+P317, P362+P364, P391, and P501"], disposalMethod: "Collect as copper-containing heavy-metal waste; prevent drain or environmental release.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/24462", raw: { source: "PubChem", cid: "24462", safetySeededAt: "2026-05-29" } },
    { id: "silver-nitrate", name: "Silver Nitrate", formula: "AgNO3", family: "Oxidizer salt", synonyms: [], summary: "Silver nitrate local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "oxidizer salt"], hazardStatements: ["H272: May intensify fire; oxidizer [Danger Oxidizing liquids; Oxidizing solids]", "H314: Causes severe skin burns and eye damage [Danger Skin corrosion/irritation]", "H400: Very toxic to aquatic life [Warning Hazardous to the aquatic environment, acute hazard]", "H410: Very toxic to aquatic life with long lasting effects [Warning Hazardous to the aquatic environment, long-term hazard]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P210, P220, P260, P264, P273, P280, P301+P330+P331, P302+P361+P354, P304+P340, P305+P354+P338, P316, P321, P363, P370+P378, P391, P405, and P501"], disposalMethod: "Collect as silver-containing oxidizing hazardous waste; keep separate from organics, reducers and halide waste.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/24470", raw: { source: "PubChem", cid: "24470", safetySeededAt: "2026-05-29" } },
    { id: "bromine", name: "Bromine", formula: "Br2", family: "Halogen", synonyms: [], summary: "Bromine local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "halogen"], hazardStatements: ["H314: Causes severe skin burns and eye damage [Danger Skin corrosion/irritation]", "H330: Fatal if inhaled [Danger Acute toxicity, inhalation]", "H400: Very toxic to aquatic life [Warning Hazardous to the aquatic environment, acute hazard]"], hazardLevel: "Severe", signalWord: "Danger", precautionaryStatements: ["P260, P264, P271, P273, P280, P284, P301+P330+P331, P302+P361+P354, P304+P340, P305+P354+P338, P316, P320, P321, P363, P391, P403+P233, P405, and P501"], disposalMethod: "Collect as reactive halogen hazardous waste; segregate from reducers, metals and organics unless EHS directs otherwise.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/24408", raw: { source: "PubChem", cid: "24408", safetySeededAt: "2026-05-29" } },
    { id: "chlorine", name: "Chlorine", formula: "Cl2", family: "Halogen gas", synonyms: [], summary: "Chlorine local safety-enriched substance record for ChemVault search and source verification workflows.", evidenceNote: "GHS summary seeded from PubChem PUG-View; verify against the current SDS before laboratory use.", tags: ["safety", "GHS", "PubChem", "halogen gas"], hazardStatements: ["H270: May cause or intensify fire; oxidizer [Danger Oxidizing gases]", "H315: Causes skin irritation [Warning Skin corrosion/irritation]", "H319: Causes serious eye irritation [Warning Serious eye damage/eye irritation]", "H331: Toxic if inhaled [Danger Acute toxicity, inhalation]", "H335: May cause respiratory irritation [Warning Specific target organ toxicity, single exposure; Respiratory tract irritation]", "H400: Very toxic to aquatic life [Warning Hazardous to the aquatic environment, acute hazard]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P220, P244, P261, P264, P264+P265, P271, P273, P280, P302+P352, P304+P340, P305+P351+P338, P316, P319, P321, P332+P317, P337+P317, P362+P364, P370+P376, P391, P403, P403+P233, P405, and P501"], disposalMethod: "Handle as toxic oxidizing gas under institutional gas-cylinder and emergency procedures; do not attempt uncontrolled disposal.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/24526", raw: { source: "PubChem", cid: "24526", safetySeededAt: "2026-05-29" } }
  ]);

  mergeUnique(data.reagents, [
    { id: "methanol", name: "Methanol", formula: "MeOH", category: "Solvent", risk: "toxic", focus: "Protic solvent and reagent", tags: ["solvent", "alcohol", "protic", "GHS", "PubChem"], safety: "PubChem GHS safety summary added for search display.", hazardStatements: ["H225: Highly Flammable liquid and vapor [Danger Flammable liquids]", "H301: Toxic if swallowed [Danger Acute toxicity, oral]", "H311: Toxic in contact with skin [Danger Acute toxicity, dermal]", "H331: Toxic if inhaled [Danger Acute toxicity, inhalation]", "H370 **: Causes damage to organs [Danger Specific target organ toxicity, single exposure]"], hazardLevel: "Severe", signalWord: "Danger", precautionaryStatements: ["P210, P233, P240, P241, P242, P243, P260, P261, P262, P264, P270, P271, P280, P301+P316, P302+P352, P303+P361+P353, P304+P340, P308+P316, P316, P321, P330, P361+P364, P370+P378, P403+P233, P403+P235, P405, and P501"], disposalMethod: "Collect as hazardous toxic flammable organic-waste; keep segregated and route through institutional EHS.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/887", raw: { source: "PubChem", cid: "887", safetySeededAt: "2026-05-29" } },
    { id: "ethanol", name: "Ethanol", formula: "EtOH", category: "Solvent", risk: "flammable", focus: "Protic solvent and reagent", tags: ["solvent", "alcohol", "protic", "GHS", "PubChem"], safety: "PubChem GHS safety summary added for search display.", hazardStatements: ["H225: Highly Flammable liquid and vapor [Danger Flammable liquids]"], hazardLevel: "High", signalWord: "Danger", precautionaryStatements: ["P210, P233, P240, P241, P242, P243, P280, P303+P361+P353, P370+P378, P403+P235, and P501"], disposalMethod: "Collect in a compatible flammable organic-waste container with ignition sources excluded; do not pour to drain.", sourceHref: "https://pubchem.ncbi.nlm.nih.gov/compound/702", raw: { source: "PubChem", cid: "702", safetySeededAt: "2026-05-29" } }
  ]);
})();
