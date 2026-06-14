(() => {
  const sources = [
    {
      id: "pubmed",
      name: "PubMed",
      owner: "NIH / National Library of Medicine",
      family: "Biomedical and chemical biology literature",
      baseUrl: "https://pubmed.ncbi.nlm.nih.gov/",
      queryUrl: "https://pubmed.ncbi.nlm.nih.gov/?term={query}",
      scope: "peer-reviewed abstracts, MeSH-indexed biomedical chemistry, pharmacology, toxicology",
      bestFor: "mechanistic biology, medicinal chemistry context, toxicology, translational studies"
    },
    {
      id: "pubchem",
      name: "PubChem",
      owner: "NIH / National Center for Biotechnology Information",
      family: "Chemical identifiers and bioactivity",
      baseUrl: "https://pubchem.ncbi.nlm.nih.gov/",
      queryUrl: "https://pubchem.ncbi.nlm.nih.gov/#query={query}",
      scope: "compound records, synonyms, identifiers, assay links, safety and vendor metadata",
      bestFor: "compound identity checks, CAS/synonym validation, bioassay starting points"
    },
    {
      id: "pmc",
      name: "PubMed Central",
      owner: "NIH / National Library of Medicine",
      family: "Open-access full text",
      baseUrl: "https://pmc.ncbi.nlm.nih.gov/",
      queryUrl: "https://pmc.ncbi.nlm.nih.gov/?term={query}",
      scope: "open full-text biomedical and methods literature",
      bestFor: "protocol details, figures, supporting information, review-level background"
    },
    {
      id: "bookshelf",
      name: "NCBI Bookshelf",
      owner: "NIH / National Center for Biotechnology Information",
      family: "Reference monographs and textbooks",
      baseUrl: "https://www.ncbi.nlm.nih.gov/books/",
      queryUrl: "https://www.ncbi.nlm.nih.gov/books/?term={query}",
      scope: "reference chapters, toxicology summaries, clinical and biochemical background",
      bestFor: "authoritative background when local notes are too brief"
    },
    {
      id: "nist",
      name: "NIST Chemistry WebBook",
      owner: "National Institute of Standards and Technology",
      family: "Spectral and thermochemical reference",
      baseUrl: "https://webbook.nist.gov/chemistry/",
      queryUrl: "https://webbook.nist.gov/cgi/cbook.cgi?Name={query}&Units=SI",
      scope: "gas-phase spectra, thermochemistry, physical constants",
      bestFor: "IR/MS reference checks and physical property triangulation"
    },
    {
      id: "iupac",
      name: "IUPAC Gold Book",
      owner: "International Union of Pure and Applied Chemistry",
      family: "Terminology and definitions",
      baseUrl: "https://goldbook.iupac.org/",
      queryUrl: "https://goldbook.iupac.org/search?search={query}",
      scope: "standard chemistry terminology and definitions",
      bestFor: "terminology verification and academic wording"
    },
    {
      id: "crossref",
      name: "Crossref",
      owner: "Crossref",
      family: "DOI and scholarly metadata",
      baseUrl: "https://search.crossref.org/",
      queryUrl: "https://search.crossref.org/?q={query}",
      scope: "DOI metadata, journals, books, proceedings",
      bestFor: "citation discovery and DOI-level bibliographic checks"
    }
  ];

  window.CHEMVAULT_EXTERNAL = { sources };
})();
