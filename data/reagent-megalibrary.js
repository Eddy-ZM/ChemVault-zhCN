(() => {
  const data = window.CHEMVAULT_DATA || (window.CHEMVAULT_DATA = {});
  data.reagents = data.reagents || [];

  const targetCount = 300;
  const known = new Set(data.reagents.map((item) => item.id));

  const profiles = {
    Oxidation: {
      risk: "oxidizer",
      transformations: ["Oxidation of alcohols, alkenes, sulfides or electron-rich substrates", "Oxidation-state adjustment under reagent-specific conditions"],
      conditions: ["Solvent, temperature and water content control selectivity", "Use stoichiometry and quench appropriate to oxidizer strength"],
      mechanism: "Oxidation proceeds through oxygen transfer, electron transfer or activated ester-like intermediates depending on reagent class.",
      traps: ["Over-oxidation and competing functional-group oxidation are common failure modes", "Procedure-specific compatibility should be checked before lab use"],
      safety: "Oxidizing reagent. Keep away from reducing agents and incompatible organics."
    },
    Reduction: {
      risk: "reducing",
      transformations: ["Reduction of carbonyls, unsaturated groups or heteroatom functionalities", "Chemoselective redox adjustment when matched to substrate"],
      conditions: ["Protic, aprotic or hydrogen-transfer conditions depend on reagent identity", "Work-up often controls final protonation state"],
      mechanism: "Reduction occurs by hydride transfer, electron transfer, surface hydrogenation or proton-coupled pathways.",
      traps: ["Selectivity depends on functional groups, solvent and temperature", "Quench and gas evolution can dominate operational risk"],
      safety: "Reducing system. Check moisture sensitivity, gas evolution and pyrophoricity."
    },
    Base: {
      risk: "basic",
      transformations: ["Deprotonation", "Enolate generation", "Base-promoted elimination or substitution"],
      conditions: ["Counterion, solvent and temperature control aggregation and selectivity", "Dry conditions may be required for strong bases"],
      mechanism: "Base removes an acidic proton or activates a nucleophile; cation and steric effects shape the outcome.",
      traps: ["Competing elimination, epimerization or over-deprotonation can occur", "Kinetic and thermodynamic claims require explicit conditions"],
      safety: "Basic reagent. Control exotherm, corrosivity and moisture sensitivity."
    },
    Acid: {
      risk: "corrosive",
      transformations: ["Acid catalysis", "Deprotection", "Electrophile activation", "Salt formation"],
      conditions: ["Acid strength, solvent and water content tune reaction pathway", "Buffered or anhydrous variants can behave differently"],
      mechanism: "Protonation or Lewis-acid coordination increases electrophilicity or leaving-group ability.",
      traps: ["Acid-labile groups can decompose", "Strong acid claims must separate catalysis from stoichiometric activation"],
      safety: "Corrosive acid or Lewis acid. Use compatible vessels and ventilation."
    },
    Coupling: {
      risk: "standard",
      transformations: ["Amide, ester, carbonate, urea or related bond formation", "Activation of carboxylic acids or heteroatom nucleophiles"],
      conditions: ["Base, additive, solvent and order of addition affect side reactions", "Water exclusion is often important"],
      mechanism: "Substrate activation generates a more reactive acyl or carbonyl intermediate followed by nucleophilic substitution.",
      traps: ["Racemization, O-acylurea formation or poor solubility may limit scope", "Purification burden should be recorded"],
      safety: "Coupling reagent. Check sensitization, energetic additive and waste guidance."
    },
    Catalysis: {
      risk: "standard",
      transformations: ["Catalytic bond formation, hydrogenation, rearrangement or redox chemistry", "Ligand- and metal-controlled selectivity"],
      conditions: ["Ligand, base, atmosphere, substrate class and catalyst loading define performance", "Trace poisons or water can change activity"],
      mechanism: "Catalytic cycles involve substrate coordination, bond activation and product-forming elementary steps.",
      traps: ["Catalyst identity alone is not enough; ligands and conditions must be stated", "Metal residues and deactivation affect reproducibility"],
      safety: "Catalyst system. Manage metal waste, gas atmosphere and ligand hazards."
    },
    Halogenation: {
      risk: "halogenating",
      transformations: ["Halogenation", "Deoxyhalogenation", "Formation of activated halide or pseudohalide intermediates"],
      conditions: ["Solvent, light, radical initiators and temperature choose ionic or radical pathways", "Dryness matters for acid chlorides and fluorinating agents"],
      mechanism: "Halogen transfer occurs through electrophilic, radical or substitution pathways depending on reagent class.",
      traps: ["Polyhalogenation and rearrangement can compete", "Regioselectivity must be tied to mechanism"],
      safety: "Halogenating reagent. Control corrosive gases, oxidizer behavior and toxicity."
    },
    Solvent: {
      risk: "solvent",
      transformations: ["Reaction medium", "Extraction medium", "Chromatography or analytical support"],
      conditions: ["Water content, inhibitor content, grade and boiling point affect method transfer", "Dry or degassed solvent may be required"],
      mechanism: "Solvent controls polarity, solvation, ion pairing, hydrogen bonding and heat transfer rather than acting as stoichiometric reagent.",
      traps: ["Solvent is not a neutral detail; it can change rate, selectivity and safety", "Residual solvent can bias spectra"],
      safety: "Solvent or additive. Manage flammability, toxicity and peroxide formation where relevant."
    },
    Protecting: {
      risk: "standard",
      transformations: ["Protecting-group installation or removal", "Temporary masking of alcohol, amine, carbonyl or acid functionality"],
      conditions: ["Base, acid, nucleophile and solvent define orthogonality", "Deprotection must be compatible with downstream substrate"],
      mechanism: "Functional group reacts to install a stable masking group or cleave it under selective conditions.",
      traps: ["Protecting-group strategy should include installation, stability and removal", "Orthogonality claims need evidence"],
      safety: "Protecting-group reagent. Check corrosivity, alkylating ability and byproducts."
    },
    Analytical: {
      risk: "indicator",
      transformations: ["Qualitative detection", "Colorimetric test", "Visualization or staining"],
      conditions: ["Concentration, matrix, pH and interfering species affect interpretation", "Use controls where possible"],
      mechanism: "Analytical response arises from complexation, redox, condensation, acid-base color change or adsorption.",
      traps: ["Positive color tests are not complete structural proof", "False positives and matrix effects must be stated"],
      safety: "Analytical reagent. Treat dyes, heavy metals and oxidizing stains according to SDS."
    },
    Organometallic: {
      risk: "dry",
      transformations: ["Carbon-carbon bond formation", "Metal-halogen exchange", "Nucleophilic addition", "Transmetalation"],
      conditions: ["Dry solvent, inert atmosphere and low temperature are often required", "Electrophile addition order controls outcome"],
      mechanism: "Polar organometallic or organoboron species reacts through addition, substitution or catalytic transmetalation.",
      traps: ["Moisture and protic groups quench reagent", "Aggregation and counterion effects can alter selectivity"],
      safety: "Organometallic or strong nucleophile. Assess pyrophoricity, quench and gas evolution."
    },
    Polymerization: {
      risk: "initiator",
      transformations: ["Monomer initiation", "Chain growth", "Crosslinking or controlled polymerization"],
      conditions: ["Oxygen exclusion, temperature, initiator ratio and conversion define polymer attributes", "Inhibitor removal may be necessary"],
      mechanism: "Reactive radicals, ions or metal-mediated species initiate and propagate polymer chains.",
      traps: ["Molecular weight, dispersity and conversion must be reported", "Bulk properties depend on processing history"],
      safety: "Polymerization reagent. Manage exotherm, peroxide initiators and monomer toxicity."
    },
    "Materials synthesis": {
      risk: "standard",
      transformations: ["Sol-gel chemistry", "Surface functionalization", "Precursor conversion", "Nanomaterial or inorganic material formation"],
      conditions: ["pH, water ratio, aging, calcination and atmosphere control structure", "Precursor purity and ligand history matter"],
      mechanism: "Material forms by hydrolysis, condensation, precipitation, ligand exchange, nucleation or surface reaction.",
      traps: ["Material identity requires characterization, not only recipe", "Batch history strongly affects properties"],
      safety: "Materials precursor. Check hydrolysis, flammability, nanoparticle and metal-waste risks."
    }
  };

  const raw = `
Sodium periodate|NaIO4|Oxidation|Vicinal diol cleavage and oxidative fragmentation|periodate,diol,cleavage
Potassium periodate|KIO4|Oxidation|Periodic oxidant for carbohydrate and diol chemistry|periodate,oxidation,carbohydrate
Periodic acid|HIO4|Oxidation|Diol cleavage and carbohydrate mapping|periodic acid,diol,oxidation
Lead tetraacetate|Pb(OAc)4|Oxidation|Oxidative cleavage and acetoxylation contexts|lead,oxidation,acetoxylation
Selenium dioxide|SeO2|Oxidation|Allylic oxidation and alpha-carbonyl oxidation|selenium,allylic,oxidation
Chromium trioxide|CrO3|Oxidation|Strong chromium(VI) oxidation|chromium,alcohol,oxidation
Sodium dichromate|Na2Cr2O7|Oxidation|Strong acid-mediated oxidation system|dichromate,oxidation,chromium
Potassium dichromate|K2Cr2O7|Oxidation|Teaching-lab alcohol oxidation reference|dichromate,alcohol,oxidation
Pyridinium dichromate|PDC|Oxidation|Chromium(VI) oxidation under milder organic conditions|PDC,chromium,alcohol
Collins reagent|CrO3-pyridine|Oxidation|Anhydrous alcohol oxidation to carbonyls|chromium,pyridine,oxidation
Manganese dioxide reagent|MnO2|Oxidation|Allylic and benzylic alcohol oxidation|manganese,allylic,alcohol
Sodium chlorite|NaClO2|Oxidation|Pinnick oxidation of aldehydes to acids|chlorite,Pinnick,aldehyde
Oxone|KHSO5|Oxidation|Peroxymonosulfate oxidation and epoxidation contexts|peroxide,Oxone,oxidation
Peracetic acid|CH3CO3H|Oxidation|Epoxidation and Baeyer-Villiger oxidant|peracid,epoxidation,oxidation
Trichloroisocyanuric acid|TCCA|Oxidation|Chlorinating oxidant for alcohols and halogenation|chlorination,oxidation,TCCA
DDQ|C8Cl2N2O2|Oxidation|Hydride abstraction and oxidative deprotection|DDQ,aromatization,deprotection
Ceric ammonium nitrate|CAN|Oxidation|Single-electron oxidation and PMB deprotection|cerium,SET,deprotection
Fremy's salt|K2NO(SO3)2|Oxidation|Phenol oxidation to quinones|quinone,phenol,radical
Bobbitt's salt|C15H25NO+BF4-|Oxidation|Oxoammonium alcohol oxidation|oxoammonium,TEMPO,alcohol
PIFA|PhI(OCOCF3)2|Oxidation|Hypervalent iodine oxidation and rearrangement|iodine,hypervalent,oxidation
PIDA|PhI(OAc)2|Oxidation|Hypervalent iodine acetoxylation and oxidative coupling|iodine,acetoxylation,oxidation
IBX stabilized|IBX|Oxidation|Hypervalent iodine alcohol oxidation|IBX,iodine,alcohol
Potassium ferricyanide|K3Fe(CN)6|Oxidation|Mild one-electron oxidant and AD co-oxidant|ferricyanide,redox,oxidation
Silver oxide|Ag2O|Oxidation|Mild oxidation and halide abstraction contexts|silver,oxidation,halide
Hydrogen peroxide urea|UHP|Oxidation|Solid peroxide oxygen donor|peroxide,UHP,oxidation
Lithium triethylborohydride|LiEt3BH|Reduction|Super-hydride carbonyl and halide reduction|hydride,borohydride,reduction
L-Selectride|LiB(sec-Bu)3H|Reduction|Bulky hydride for stereoselective reduction|hydride,selective,ketone
K-Selectride|KB(sec-Bu)3H|Reduction|Bulky potassium hydride donor|hydride,selective,reduction
Schwartz reagent|Cp2ZrHCl|Reduction|Hydrozirconation and selective reduction|zirconium,hydrozirconation,alkyne
Hydrazine hydrate|N2H4.H2O|Reduction|Wolff-Kishner and deprotection reagent|hydrazine,reduction,deprotection
Clemmensen system|Zn(Hg)/HCl|Reduction|Carbonyl to methylene under acidic conditions|Clemmensen,carbonyl,zinc
Diimide|N2H2|Reduction|Syn alkene reduction without metal catalyst|diimide,alkene,reduction
Ammonium formate|HCO2NH4|Reduction|Transfer hydrogenation donor|formate,transfer hydrogenation,reduction
Polymethylhydrosiloxane|PMHS|Reduction|Hydrosilane reducing agent and transfer reagent|silane,reduction,hydrosilylation
Triethylsilane|Et3SiH|Reduction|Ionic hydride donor in acid-mediated reductions|silane,hydride,reduction
Tributyltin hydride|Bu3SnH|Reduction|Radical dehalogenation and cyclization reagent|tin,radical,reduction
Zinc dust|Zn|Reduction|Reductive work-up and metal-mediated reductions|zinc,reduction,metal
Iron powder|Fe|Reduction|Nitro reduction and reductive transformations|iron,nitro,reduction
Sodium dithionite|Na2S2O4|Reduction|Aqueous reductant for dyes and nitro groups|dithionite,reduction,aqueous
Sodium thiosulfate|Na2S2O3|Reduction|Iodine quench and redox work-up reagent|thiosulfate,quench,redox
Sodium sulfite|Na2SO3|Reduction|Mild reducing quench and antioxidant|sulfite,quench,reduction
Samarium diiodide|SmI2|Reduction|Single-electron reductant for coupling and dehalogenation|samarium,SET,reduction
Hantzsch ester|C13H19NO4|Reduction|Biomimetic hydride donor|hydride,organocatalysis,reduction
Formic acid hydrogen donor|HCO2H|Reduction|Transfer hydrogenation donor and acid|formate,hydrogenation,reduction
Borane dimethyl sulfide|BH3.SMe2|Reduction|Carboxylic acid and hydroboration reagent|borane,reduction,hydroboration
Calcium borohydride|Ca(BH4)2|Reduction|Hydride donor in selected reductions|borohydride,reduction,hydride
Lithium hydride|LiH|Base|Strong hydride base and hydrogen source|hydride,base,dry
Sodium hydride dispersion|NaH|Base|Strong base for alcohols and active methylene compounds|base,hydride,deprotonation
Potassium hydride|KH|Base|Very strong hydride base|base,hydride,potassium
Lithium bis(trimethylsilyl)amide|LiHMDS|Base|Strong hindered amide base|amide base,enolate,lithium
Sodium bis(trimethylsilyl)amide|NaHMDS|Base|Strong hindered sodium amide base|amide base,enolate,sodium
DBU|C9H16N2|Base|Non-nucleophilic amidine base|amidine,base,elimination
DBN|C7H12N2|Base|Amidine base for elimination and catalysis|amidine,base,elimination
Tetramethylguanidine|TMG|Base|Strong organic guanidine base|guanidine,base,organocatalysis
Proton sponge|C14H18N2|Base|Sterically hindered strong organic base|base,proton sponge,non-nucleophilic
Sodium tert-butoxide|NaOtBu|Base|Strong alkoxide base|alkoxide,base,elimination
Lithium tert-butoxide|LiOtBu|Base|Lithium alkoxide base|alkoxide,base,lithium
Potassium carbonate|K2CO3|Base|Mild inorganic base for alkylation and coupling|carbonate,base,mild
Cesium carbonate|Cs2CO3|Base|Strong carbonate base with cesium effect|carbonate,cesium,coupling
Sodium carbonate|Na2CO3|Base|Mild base and buffer|carbonate,base,aqueous
Sodium bicarbonate|NaHCO3|Base|Weak base for neutralization and extraction|bicarbonate,base,quench
Lithium carbonate|Li2CO3|Base|Lithium source and mild base|lithium,carbonate,materials
Barium hydroxide|Ba(OH)2|Base|Strong inorganic base|hydroxide,base,barium
Calcium hydroxide|Ca(OH)2|Base|Inorganic base and neutralizing reagent|hydroxide,base,calcium
Sodium methoxide|NaOMe|Base|Alkoxide base and transesterification reagent|methoxide,base,ester
Sodium ethoxide|NaOEt|Base|Alkoxide base in ethanol systems|ethoxide,base,elimination
Potassium phosphate tribasic|K3PO4|Base|Inorganic base for cross-coupling|phosphate,base,coupling
Sodium phosphate dibasic|Na2HPO4|Base|Buffer and mild base|phosphate,buffer,base
Sodium acetate|NaOAc|Base|Weak base and acetate source|acetate,base,buffer
2,6-Lutidine|C7H9N|Base|Hindered pyridine base|pyridine,base,hindered
2,4,6-Collidine|C8H11N|Base|Hindered aromatic amine base|pyridine,base,hindered
Hydrochloric acid|HCl|Acid|Strong protic acid and salt-forming reagent|acid,chloride,deprotection
Hydrobromic acid|HBr|Acid|Strong acid and bromide source|acid,bromide,deprotection
Hydroiodic acid|HI|Acid|Strong acid and iodide reductive medium|acid,iodide,reduction
Sulfuric acid|H2SO4|Acid|Strong acid dehydrating medium|acid,dehydration,catalysis
Nitric acid|HNO3|Acid|Nitrating and oxidizing acid|nitration,acid,oxidation
Phosphoric acid|H3PO4|Acid|Acid catalyst and buffer component|acid,catalysis,buffer
p-Toluenesulfonic acid|p-TsOH|Acid|Organic sulfonic acid catalyst|acid,sulfonic,deprotection
Camphorsulfonic acid|CSA|Acid|Chiral sulfonic acid catalyst and deprotection acid|acid,CSA,catalysis
Triflic acid|TfOH|Acid|Superacidic activation reagent|superacid,triflate,activation
Methanesulfonic acid|MsOH|Acid|Strong organic acid|acid,sulfonic,activation
Acetic acid|AcOH|Acid|Weak acid solvent and proton source|acid,solvent,buffer
Benzoic acid|C6H5CO2H|Acid|Carboxylic acid additive and standard|acid,carboxylic,additive
Boron trifluoride etherate|BF3.OEt2|Acid|Lewis acid activation reagent|Lewis acid,boron,activation
Titanium tetrachloride|TiCl4|Acid|Strong Lewis acid and materials precursor|Lewis acid,titanium,chloride
Tin tetrachloride|SnCl4|Acid|Strong Lewis acid for carbonyl and aromatic activation|Lewis acid,tin,activation
T3P|C9H21O6P3|Coupling|Propylphosphonic anhydride coupling reagent|amide,coupling,anhydride
COMU|C12H19N4O4PF6|Coupling|Uronium-type amide coupling reagent|amide,coupling,uronium
HBTU|C11H16N5OPF6|Coupling|Peptide coupling uronium reagent|amide,peptide,coupling
TBTU|C11H16BF4N5O|Coupling|Tetrafluoroborate uronium coupling reagent|amide,peptide,coupling
BOP-Cl|C6H15ClN3OP|Coupling|Phosphonium activation reagent|amide,coupling,phosphonium
Ghosez reagent|C3H4ClNO|Coupling|Amide to acid chloride activation reagent|acid chloride,activation,coupling
Mukaiyama reagent|C6H7ClN2+I-|Coupling|Condensation reagent for ester and amide formation|pyridinium,coupling,condensation
N-Hydroxysuccinimide|NHS|Coupling|Activated ester additive|NHS,ester,amide
Sulfo-NHS|C4H4NNaO6S|Coupling|Water-soluble activated ester additive|NHS,bioconjugation,coupling
Diisopropylcarbodiimide|DIC|Coupling|Carbodiimide coupling reagent|carbodiimide,amide,peptide
HCTU|C11H15ClF6N6OP|Coupling|Peptide coupling reagent|amide,peptide,coupling
PyAOP|C18H28F6N6OP2|Coupling|Phosphonium coupling reagent|amide,peptide,coupling
DEPBT|C13H13N4O3P|Coupling|Amide coupling reagent with benzotriazole leaving group|amide,coupling,peptide
EEDQ|C13H13NO3|Coupling|Carboxyl activation reagent|amide,ester,coupling
Cyanuric chloride|C3Cl3N3|Coupling|Triazine activation and derivatization reagent|triazine,chloride,coupling
Isobutyl chloroformate|C5H9ClO2|Coupling|Mixed anhydride formation reagent|chloroformate,amide,coupling
Ethyl chloroformate|C3H5ClO2|Coupling|Mixed anhydride and carbonate reagent|chloroformate,carbonate,coupling
Pivaloyl chloride|C5H9ClO|Coupling|Mixed anhydride activation reagent|acid chloride,coupling,activation
Carbonyldiimidazole derivative|CDI|Coupling|Imidazolide activation reagent|imidazole,coupling,carbonyl
Pentafluorophenol|C6HF5O|Coupling|Activated ester leaving group precursor|PFP,ester,coupling
HOSu ester precursor|HOSu|Coupling|Succinimidyl ester formation additive|NHS,ester,coupling
Chloro-N,N,N',N'-tetramethylformamidinium hexafluorophosphate|TCFH|Coupling|Amide coupling activator|formamidinium,coupling,amide
Propylphosphonic anhydride solution|T3P solution|Coupling|Operational T3P coupling solution|amide,coupling,anhydride
1-Ethyl-3-methylimidazolium acetate|EMIM OAc|Coupling|Ionic liquid medium and activation context|ionic liquid,acetate,coupling
Palladium acetate|Pd(OAc)2|Catalysis|Palladium catalyst precursor|palladium,cross-coupling,catalyst
Tris(dibenzylideneacetone)dipalladium|Pd2(dba)3|Catalysis|Pd(0) catalyst precursor|palladium,Pd0,cross-coupling
Palladium chloride|PdCl2|Catalysis|Palladium(II) catalyst precursor|palladium,chloride,catalyst
Tetrakis(acetonitrile)palladium tetrafluoroborate|Pd(MeCN)4(BF4)2|Catalysis|Cationic palladium source|palladium,cationic,catalyst
Nickel chloride dppp|NiCl2(dppp)|Catalysis|Nickel cross-coupling catalyst precursor|nickel,cross-coupling,catalyst
Nickel bromide diglyme|NiBr2(diglyme)|Catalysis|Nickel catalyst precursor|nickel,bromide,catalyst
Platinum oxide|PtO2|Catalysis|Adams catalyst for hydrogenation|platinum,hydrogenation,catalyst
Adams catalyst|PtO2.H2O|Catalysis|Hydrogenation catalyst|platinum,hydrogenation,catalyst
Crabtree catalyst|Ir(cod)(PCy3)(py)PF6|Catalysis|Homogeneous hydrogenation catalyst|iridium,hydrogenation,catalyst
Grubbs first-generation catalyst|RuCl2(PCy3)2=CHPh|Catalysis|Olefin metathesis catalyst|ruthenium,metathesis,alkene
Hoveyda-Grubbs second-generation catalyst|Ru metathesis catalyst|Catalysis|Olefin metathesis catalyst|ruthenium,metathesis,catalyst
Rhodium acetate dimer|Rh2(OAc)4|Catalysis|Carbene and nitrene transfer catalyst|rhodium,carbene,catalyst
Copper iodide|CuI|Catalysis|Copper catalyst for coupling and click chemistry|copper,Sonogashira,click
Copper chloride|CuCl|Catalysis|Copper(I) catalyst precursor|copper,catalyst,coupling
Copper acetate|Cu(OAc)2|Catalysis|Copper(II) oxidant and catalyst|copper,oxidation,catalyst
Iron(III) chloride|FeCl3|Catalysis|Lewis acid and oxidative catalyst|iron,Lewis acid,catalyst
Aluminium chloride|AlCl3|Catalysis|Lewis acid for Friedel-Crafts chemistry|aluminum,Lewis acid,EAS
Zinc chloride|ZnCl2|Catalysis|Lewis acid activation reagent|zinc,Lewis acid,activation
Scandium triflate|Sc(OTf)3|Catalysis|Water-tolerant Lewis acid catalyst|scandium,triflate,Lewis acid
Ytterbium triflate|Yb(OTf)3|Catalysis|Lanthanide Lewis acid catalyst|ytterbium,triflate,catalyst
L-Proline|C5H9NO2|Catalysis|Organocatalyst for enamine and iminium chemistry|organocatalysis,proline,aldol
DMAP catalyst|DMAP|Catalysis|Acyl transfer catalyst|DMAP,acylation,catalysis
N-Heterocyclic carbene precursor|IMes.HCl|Catalysis|NHC organocatalyst precursor|NHC,organocatalysis,umpolung
Jacobsen catalyst|Mn(salen)Cl|Catalysis|Asymmetric epoxidation catalyst|manganese,salen,epoxidation
Sharpless titanium tartrate catalyst|Ti(OiPr)4/DET|Catalysis|Asymmetric epoxidation system|titanium,tartrate,asymmetric
N-Chlorosuccinimide|NCS|Halogenation|Chlorination reagent|chlorination,succinimide,alkene
N-Iodosuccinimide|NIS|Halogenation|Iodination reagent|iodination,succinimide,alkene
Bromine|Br2|Halogenation|Electrophilic bromination reagent|bromine,halogenation,alkene
Iodine|I2|Halogenation|Iodination and mild oxidizing reagent|iodine,halogenation,redox
Phosphorus trichloride|PCl3|Halogenation|Alcohol and acid chlorination reagent|chlorination,phosphorus,alcohol
Phosphorus pentachloride|PCl5|Halogenation|Strong chlorinating reagent|chlorination,phosphorus,acid chloride
Phosphoryl chloride|POCl3|Halogenation|Dehydrating chlorination reagent|Vilsmeier,chlorination,dehydration
Deoxo-Fluor|Deoxo-Fluor|Halogenation|Deoxyfluorination reagent|fluorination,alcohol,deoxyfluorination
Selectfluor|C7H14Cl2F2N2|Halogenation|Electrophilic fluorination reagent|fluorination,electrophilic,N-F
NFSI|C12H8FNO4S2|Halogenation|Electrophilic fluorination and imidation reagent|fluorination,NFSI,electrophilic
HF-pyridine|HF-pyridine|Halogenation|Fluorination and deprotection reagent|fluoride,acid,fluorination
Olah reagent|HF-pyridine|Halogenation|Buffered HF fluorination reagent|HF,fluorination,deprotection
XtalFluor-E|C8H20F2NS+BF4-|Halogenation|Deoxyfluorination reagent|fluorination,sulfur,alcohol
XtalFluor-M|C6H16F2NS+BF4-|Halogenation|Deoxyfluorination reagent|fluorination,deoxyfluorination,sulfur
PyFluor|C5H5FNO2S|Halogenation|Deoxyfluorination reagent|fluorination,pyridine,sulfonyl
Ishikawa reagent|Et2NCF2CF3|Halogenation|Fluorinating reagent|fluorination,amine,alcohol
BAST|C4H10F3NS|Halogenation|Deoxyfluorination reagent|fluorination,sulfur,alcohol
Potassium bifluoride|KHF2|Halogenation|Fluoride source|fluoride,fluorination,inorganic
Silver fluoride|AgF|Halogenation|Fluoride source and halide exchange reagent|fluoride,silver,halide exchange
Cesium fluoride|CsF|Halogenation|Fluoride base and desilylation reagent|fluoride,cesium,base
Chloramine-T|C7H7ClNNaO2S|Halogenation|N-chloro oxidant and chlorination reagent|chlorination,oxidation,sulfonamide
Iodine monochloride|ICl|Halogenation|Iodination and electrophilic halogenation reagent|iodination,halogenation,electrophile
Bromine monochloride|BrCl|Halogenation|Mixed halogen electrophile|bromination,chlorination,halogen
Tetrabutylammonium iodide|TBAI|Halogenation|Iodide additive for halide exchange|iodide,phase transfer,substitution
Toluene|C7H8|Solvent|Aromatic hydrocarbon solvent|solvent,aromatic,nonpolar
Dichloromethane|CH2Cl2|Solvent|Chlorinated extraction and reaction solvent|solvent,chlorinated,extraction
Chloroform|CHCl3|Solvent|Chlorinated solvent and NMR solvent context|solvent,chlorinated,NMR
Carbon tetrachloride|CCl4|Solvent|Historical nonpolar chlorinated solvent|solvent,chlorinated,historical
Diethyl ether|Et2O|Solvent|Ether solvent for organometallic chemistry|solvent,ether,Grignard
MTBE|C5H12O|Solvent|Ether extraction solvent|solvent,ether,extraction
1,4-Dioxane|C4H8O2|Solvent|Cyclic ether solvent|solvent,ether,polar aprotic
Dimethoxyethane|DME|Solvent|Coordinating ether solvent|solvent,ether,organometallic
Diglyme|C6H14O3|Solvent|High-boiling polyether solvent|solvent,ether,high boiling
Glyme|C4H10O2|Solvent|Coordinating ether solvent|solvent,ether,lithium
N-Methyl-2-pyrrolidone|NMP|Solvent|Polar aprotic solvent|solvent,polar aprotic,polymer
Dimethylacetamide|DMAc|Solvent|Polar amide solvent|solvent,amide,polar aprotic
HMPA|C6H18N3OP|Solvent|Strongly coordinating polar additive|solvent,additive,lithium
Sulfolane|C4H8O2S|Solvent|High-boiling polar solvent|solvent,sulfone,high boiling
Methanol|MeOH|Solvent|Protic solvent and reagent|solvent,alcohol,protic
Ethanol|EtOH|Solvent|Protic solvent and recrystallization medium|solvent,alcohol,protic
Isopropanol|i-PrOH|Solvent|Protic solvent and transfer hydrogen donor|solvent,alcohol,reduction
tert-Butanol|t-BuOH|Solvent|Bulky protic solvent|solvent,alcohol,bulky
Water|H2O|Solvent|Aqueous medium and quench reagent|solvent,aqueous,quench
Acetic anhydride|Ac2O|Solvent|Acetylating reagent and dehydrating medium|acetylation,anhydride,solvent
Imidazole|C3H4N2|Solvent|Base and silylation additive|base,imidazole,silylation
Molecular sieves 3A|3A zeolite|Solvent|Drying agent for small molecules and solvents|drying,zeolite,solvent
Molecular sieves 4A|4A zeolite|Solvent|General solvent drying agent|drying,zeolite,solvent
Celite|diatomaceous earth|Solvent|Filtration aid|filtration,workup,solid support
Activated charcoal|C|Solvent|Decolorizing adsorbent|adsorbent,purification,carbon
Brine|NaCl aq.|Solvent|Extraction wash and phase separation aid|workup,extraction,aqueous
Hexanes|C6 hydrocarbons|Solvent|Nonpolar chromatography solvent mixture|solvent,chromatography,nonpolar
Cyclohexane|C6H12|Solvent|Nonpolar solvent and recrystallization medium|solvent,nonpolar,recrystallization
Petroleum ether|hydrocarbon mixture|Solvent|Low-boiling nonpolar chromatography solvent|solvent,chromatography,nonpolar
Ethylene glycol|C2H6O2|Solvent|High-boiling diol solvent and reductant context|solvent,diol,high boiling
TBDPS chloride|TBDPSCl|Protecting|Bulky silyl protecting group reagent|silyl,protection,alcohol
TIPS chloride|TIPSCl|Protecting|Triisopropylsilyl protection reagent|silyl,protection,alcohol
TES chloride|TESCl|Protecting|Triethylsilyl protection reagent|silyl,protection,alcohol
SEM chloride|SEMCl|Protecting|SEM protecting group reagent|protection,SEM,alcohol
MOM chloride|MOMCl|Protecting|Methoxymethyl protection reagent|MOM,protection,alcohol
BOM chloride|BOMCl|Protecting|Benzyloxymethyl protection reagent|BOM,protection,alcohol
Benzyl bromide|BnBr|Protecting|Benzyl protecting group installation|benzyl,protection,alkylation
Benzyl chloride|BnCl|Protecting|Benzylation reagent|benzyl,protection,alkylation
Cbz chloride|CbzCl|Protecting|Amine Cbz protection reagent|Cbz,amine,protection
Fmoc chloride|FmocCl|Protecting|Amine Fmoc protection reagent|Fmoc,amine,peptide
Alloc chloride|AllocCl|Protecting|Allyloxycarbonyl protection reagent|Alloc,amine,protection
Troc chloride|TrocCl|Protecting|Trichloroethyl carbamate protection reagent|Troc,amine,protection
HCl in dioxane|HCl/dioxane|Protecting|Boc deprotection acid solution|deprotection,Boc,acid
Hexafluoroisopropanol|HFIP|Protecting|Strong hydrogen-bonding solvent for deprotection and peptide chemistry|solvent,deprotection,peptide
Piperidine|C5H11N|Protecting|Fmoc deprotection base|Fmoc,deprotection,base
Trimethylsilyl iodide|TMSI|Protecting|Ether cleavage and silyl iodide reagent|TMSI,deprotection,iodide
Boron tribromide|BBr3|Protecting|Aryl ether demethylation reagent|demethylation,Lewis acid,deprotection
Thiophenol|PhSH|Protecting|Cleavage reagent and nucleophile|thiol,deprotection,nucleophile
Anisole scavenger|PhOMe|Protecting|Cation scavenger in acid deprotection|scavenger,deprotection,anisole
Triisopropylsilane|TIPS-H|Protecting|Cation scavenger and silane reductant|scavenger,silane,deprotection
Dragendorff reagent|BiI4-|Analytical|Alkaloid detection reagent|alkaloid,stain,qualitative
Mayer reagent|K2HgI4|Analytical|Alkaloid precipitation reagent|alkaloid,mercury,test
Wagner reagent|I2/KI|Analytical|Alkaloid detection reagent|iodine,alkaloid,test
Ehrlich reagent|p-DMAB|Analytical|Indole and pyrrole detection reagent|indole,color test,analytical
Nessler reagent|K2HgI4/KOH|Analytical|Ammonia detection reagent|ammonia,mercury,color test
Schiff reagent|fuchsin-sulfurous acid|Analytical|Aldehyde color test|aldehyde,color test,analytical
Molisch reagent|alpha-naphthol|Analytical|Carbohydrate detection reagent|carbohydrate,color test,analytical
Benedict reagent|Cu(II) citrate|Analytical|Reducing sugar test reagent|sugar,redox,copper
Biuret reagent|CuSO4/NaOH|Analytical|Protein peptide-bond test|protein,copper,color test
Bradford reagent|Coomassie dye|Analytical|Protein assay dye reagent|protein,dye,assay
Coomassie Brilliant Blue|C47H48N3NaO7S2|Analytical|Protein staining dye|protein,stain,dye
Bromothymol blue|C27H28Br2O5S|Analytical|pH indicator dye|indicator,pH,dye
Phenolphthalein|C20H14O4|Analytical|pH indicator|indicator,pH,acid-base
Methyl orange|C14H14N3NaO3S|Analytical|pH indicator dye|indicator,pH,dye
Litmus|indicator mixture|Analytical|Acid-base indicator|indicator,pH,teaching
Iodine vapor|I2 vapor|Analytical|TLC visualization reagent|TLC,iodine,visualization
Phosphomolybdic acid|PMA|Analytical|TLC stain for oxidizable compounds|TLC,stain,oxidation
Ceric ammonium molybdate|CAM|Analytical|TLC stain reagent|TLC,stain,cerium
Vanillin stain|vanillin/H2SO4|Analytical|General TLC visualization stain|TLC,stain,vanillin
Anisaldehyde stain|anisaldehyde/H2SO4|Analytical|General TLC visualization stain|TLC,stain,anisaldehyde
Methylmagnesium bromide|MeMgBr|Organometallic|Grignard reagent for methyl addition|Grignard,organometallic,methyl
Phenylmagnesium bromide|PhMgBr|Organometallic|Grignard reagent for phenyl addition|Grignard,phenyl,organometallic
Vinylmagnesium bromide|CH2=CHMgBr|Organometallic|Vinyl Grignard reagent|Grignard,vinyl,addition
Ethylmagnesium bromide|EtMgBr|Organometallic|Ethyl Grignard reagent|Grignard,ethyl,addition
Allylmagnesium bromide|allylMgBr|Organometallic|Allyl Grignard reagent|allyl,Grignard,addition
Methyllithium|MeLi|Organometallic|Strong organolithium nucleophile|organolithium,methyl,addition
tert-Butyllithium|t-BuLi|Organometallic|Strong organolithium base and exchange reagent|organolithium,pyrophoric,base
sec-Butyllithium|s-BuLi|Organometallic|Organolithium base for lithiation|organolithium,lithiation,base
Phenyllithium|PhLi|Organometallic|Aryl lithium nucleophile|organolithium,phenyl,addition
Lithium acetylide|LiCCH|Organometallic|Acetylide nucleophile|acetylide,alkyne,nucleophile
Trimethylsilylacetylene|TMS-acetylene|Organometallic|Protected alkyne building block|alkyne,TMS,Sonogashira
Ethynylmagnesium bromide|HC=CMgBr|Organometallic|Ethynyl Grignard reagent|alkyne,Grignard,addition
Copper cyanide|CuCN|Organometallic|Organocuprate precursor and cyanide source|copper,cyanide,cuprate
Lithium dimethylcuprate|Me2CuLi|Organometallic|Gilman reagent for conjugate addition|cuprate,conjugate addition,organometallic
Gilman reagent|R2CuLi|Organometallic|Organocuprate carbon-carbon bond formation|cuprate,organometallic,coupling
Vinylboronic acid pinacol ester|vinyl-Bpin|Organometallic|Suzuki vinyl transfer partner|boron,Suzuki,vinyl
Bis(pinacolato)diboron|B2pin2|Organometallic|Borylation reagent|boron,borylation,cross-coupling
Catecholborane|HBcat|Organometallic|Hydroboration reagent|borane,hydroboration,reduction
Pinacolborane|HBpin|Organometallic|Hydroboration and borylation reagent|boron,hydroboration,borylation
Potassium organotrifluoroborate|RBF3K|Organometallic|Stable boron cross-coupling partner|boron,Suzuki,trifluoroborate
Sodium methanethiolate|NaSMe|Organometallic|Sulfur nucleophile|thiolate,nucleophile,substitution
Thiourea|CH4N2S|Organometallic|Sulfur nucleophile and thiol precursor|thiourea,nucleophile,sulfur
Potassium cyanide|KCN|Organometallic|Cyanide nucleophile|cyanide,nucleophile,toxic
Sodium cyanide|NaCN|Organometallic|Cyanide nucleophile|cyanide,nucleophile,toxic
Trimethylsilyl cyanide|TMSCN|Organometallic|Cyanide equivalent for carbonyl addition|cyanide,silyl,nucleophile
Nitromethane|CH3NO2|Organometallic|Nitroalkane C-nucleophile precursor|nitro,nucleophile,Henry
Malononitrile|C3H2N2|Organometallic|Active methylene nucleophile|nitrile,nucleophile,Knoevenagel
Diethyl malonate|C7H12O4|Organometallic|Active methylene nucleophile|malonate,nucleophile,alkylation
Ethyl acetoacetate|C6H10O3|Organometallic|Beta-keto ester nucleophile|enolate,nucleophile,alkylation
Meldrum's acid|C6H8O4|Organometallic|Activated methylene reagent|active methylene,Knoevenagel,nucleophile
ACVA|C8H12N4O4|Polymerization|Water-compatible azo initiator|initiator,radical,polymer
V-70 initiator|azo initiator|Polymerization|Low-temperature radical initiator|initiator,radical,polymer
CPADB|RAFT agent|Polymerization|RAFT chain-transfer agent|RAFT,polymerization,CTA
DDMAT|RAFT agent|Polymerization|Trithiocarbonate RAFT agent|RAFT,polymer,CTA
CuCl bipyridine|CuCl/bpy|Polymerization|ATRP catalyst system|ATRP,copper,polymer
CuBr PMDETA|CuBr/PMDETA|Polymerization|ATRP catalyst system|ATRP,copper,polymer
Grubbs third-generation catalyst|Ru indenylidene catalyst|Polymerization|ROMP catalyst|ROMP,ruthenium,polymer
Ziegler-Natta catalyst|TiCl4/AlEt3|Polymerization|Olefin polymerization catalyst|polyolefin,titanium,catalyst
Methylaluminoxane|MAO|Polymerization|Olefin polymerization activator|aluminum,polymerization,activator
Ethylene glycol dimethacrylate|EGDMA|Polymerization|Crosslinking monomer|crosslinker,methacrylate,polymer
Divinylbenzene|DVB|Polymerization|Aromatic crosslinking monomer|crosslinker,styrene,polymer
N,N-Methylenebisacrylamide|BIS|Polymerization|Acrylamide crosslinker|crosslinker,hydrogel,polymer
Sodium persulfate|Na2S2O8|Polymerization|Radical initiator oxidant|persulfate,initiator,polymer
Potassium persulfate|K2S2O8|Polymerization|Radical initiator oxidant|persulfate,initiator,polymer
TEMED|C6H16N2|Polymerization|Persulfate accelerator|TEMED,hydrogel,polymer
APTES|H2N(CH2)3Si(OEt)3|Materials synthesis|Amine silane surface functionalization reagent|silane,surface,materials
MPTMS|HS(CH2)3Si(OMe)3|Materials synthesis|Thiol silane surface functionalization reagent|silane,thiol,surface
GPTMS|epoxy silane|Materials synthesis|Epoxy silane coupling agent|silane,epoxy,surface
HMDS|[(CH3)3Si]2NH|Materials synthesis|Silylating reagent and surface modifier|silylation,surface,materials
Sodium silicate|Na2SiO3|Materials synthesis|Silica precursor for sol-gel materials|silicate,sol-gel,silica
Aluminum isopropoxide|Al(OiPr)3|Materials synthesis|Alumina precursor and MPV reagent|aluminum,sol-gel,materials
Lithium carbonate precursor|Li2CO3|Materials synthesis|Lithium source for ceramic synthesis|lithium,ceramic,battery
Lanthanum oxide|La2O3|Materials synthesis|Lanthanum precursor for oxide ceramics|lanthanum,oxide,materials
Zirconium propoxide|Zr(OPr)4|Materials synthesis|Zirconia sol-gel precursor|zirconium,sol-gel,oxide
Ammonium hydroxide|NH4OH|Materials synthesis|Precipitation base for metal hydroxides|base,precipitation,materials
Urea hydrolysis reagent|CO(NH2)2|Materials synthesis|Slow base generator for precipitation|urea,precipitation,hydrothermal
Hexamethylenetetramine|HMTA|Materials synthesis|Slow base and formaldehyde source|HMTA,hydrothermal,materials
Oleic acid surfactant|C18H34O2|Materials synthesis|Nanoparticle ligand and surfactant|surfactant,nanoparticle,ligand
Oleylamine|C18H37N|Materials synthesis|Nanocrystal ligand and reducing medium|surfactant,amine,nanocrystal
Polyvinylpyrrolidone|PVP|Materials synthesis|Nanoparticle stabilizer|polymer,stabilizer,nanoparticle
Cetyltrimethylammonium bromide|CTAB|Materials synthesis|Cationic surfactant templating reagent|surfactant,template,mesoporous
Sodium dodecyl sulfate|SDS|Materials synthesis|Anionic surfactant and micelle reagent|surfactant,anionic,materials
Pluronic P123|PEO-PPO-PEO|Materials synthesis|Block-copolymer template|template,mesoporous,polymer
Pluronic F127|PEO-PPO-PEO|Materials synthesis|Block-copolymer template for mesostructures|template,hydrogel,materials
Citric acid chelator|C6H8O7|Materials synthesis|Chelating and combustion synthesis reagent|chelation,sol-gel,materials
Ethylene glycol sol-gel|C2H6O2|Materials synthesis|Polyol solvent and chelating medium|polyol,sol-gel,materials
Triethanolamine|TEOA|Materials synthesis|Complexing base and sol-gel additive|amine,chelation,sol-gel
Acetylacetone|acacH|Materials synthesis|Metal chelator and precursor modifier|chelation,sol-gel,metal
`;

  function slug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  raw.trim().split("\n").forEach((line) => {
    if (data.reagents.length >= targetCount) return;
    const [name, formula, category, focus, tagText] = line.split("|");
    const id = slug(name);
    if (!name || known.has(id)) return;
    const profile = profiles[category] || profiles.Coupling;
    data.reagents.push({
      id,
      name,
      formula,
      category,
      risk: profile.risk,
      focus,
      tags: (tagText || "").split(",").map((tag) => tag.trim()).filter(Boolean),
      transformations: profile.transformations,
      conditions: profile.conditions,
      scope: `${name} is indexed as a ${category.toLowerCase()} record for research search, route comparison and evidence triage.`,
      mechanism: profile.mechanism,
      traps: profile.traps,
      safety: profile.safety
    });
    known.add(id);
  });
})();
