import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import test from "node:test";

function loadSearchIntent() {
  const context = {
    window: {},
    console
  };
  context.globalThis = context.window;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("scripts/search-intent.js", "utf8"), context, {
    filename: "scripts/search-intent.js"
  });
  return context.window.CHEMVAULT_SEARCH_INTENT;
}

test("ketone to alcohol intent ranks the expected reduction options", () => {
  const api = loadSearchIntent();
  const index = [
    { id: "nabh4", recordType: "reagent", type: "Reagent", title: "Sodium borohydride", formula: "NaBH4", body: "Ketone to secondary alcohol" },
    { id: "lialh4", recordType: "reagent", type: "Reagent", title: "Lithium aluminium hydride", formula: "LiAlH4", body: "Aldehyde or ketone to alcohol" },
    { id: "h2pd", recordType: "reagent", type: "Reagent", title: "Catalytic hydrogenation", formula: "H2 / Pd-C", body: "Hydrogenation of reducible groups" },
    { id: "mpv-reduction", recordType: "reagent", type: "Reagent", title: "Meerwein-Ponndorf-Verley reduction", formula: "Al(O-i-Pr)3 / i-PrOH", body: "Ketone to alcohol transfer hydrogenation" },
    { id: "pcc", recordType: "reagent", type: "Reagent", title: "Pyridinium chlorochromate", formula: "PCC", body: "Alcohol to ketone oxidation" }
  ];

  const matches = api.rank("ketone to alcohol", index, { limit: 4 });

  assert.deepEqual(
    matches.map((match) => match.item.id),
    ["nabh4", "lialh4", "h2pd", "mpv-reduction"]
  );
  assert.equal(matches[0].intent.id, "ketone-to-alcohol");
  assert(matches.every((match) => match.score > 0));
});

test("stable record ids prevent broad aliases from pulling unrelated hydrides into intent results", () => {
  const api = loadSearchIntent();
  const index = [
    { id: "nabh4", recordType: "reagent", type: "Reagent", title: "Sodium borohydride", formula: "NaBH4", body: "Ketone to secondary alcohol" },
    { id: "calcium-borohydride", recordType: "reagent", type: "Reagent", title: "Calcium borohydride", formula: "Ca(BH4)2", body: "Hydride donor in selected reductions" },
    { id: "hydride-transfer", recordType: "mechanism", type: "Mechanism", title: "Hydride transfer", body: "Hydride delivery to carbonyls" },
    { id: "mpv-reduction", recordType: "reagent", type: "Reagent", title: "Meerwein-Ponndorf-Verley reduction", formula: "Al(O-i-Pr)3 / i-PrOH", body: "Ketone to alcohol transfer hydrogenation" }
  ];

  const matches = api.rank("ketone to alcohol", index, { limit: 4 });

  assert.deepEqual(
    matches.map((match) => match.item.id),
    ["nabh4", "mpv-reduction"]
  );
});

test("intent parser handles arrow and product wording", () => {
  const api = loadSearchIntent();

  assert.equal(api.detect("ketone -> secondary alcohol")?.id, "ketone-to-alcohol");
  assert.equal(api.detect("reduce a ketone into an alcohol")?.id, "ketone-to-alcohol");
});
