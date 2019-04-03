import { terser } from "rollup-plugin-terser";
import babel from "rollup-plugin-babel";

export default [
  {
    input: "js/main.js",
    plugins: [babel(), terser()],
    external: ["@agc-calculators/calculators-core", "redom"],
    output: {
      file: "dist/umd/agc-components.js",
      format: "umd",
      name: "agcComponents",
      globals: {
        "@agc-calculators/calculators-core": "agcCalculatorsCore",
        redom: "redom"
      },
      esModule: false
    }
  },
  {
    input: "js/main.js",
    plugins: [babel()],
    external: ["@agc-calculators/calculators-core", "redom"],
    output: {
      file: "dist/esm/index.js",
      format: "esm",
      globals: {
        "@agc-calculators/calculators-core": "agcCalculatorsCore",
        redom: "redom"
      }
    }
  },
  {
    input: "js/main.js",
    plugins: [babel()],
    external: ["@agc-calculators/calculators-core", "redom"],
    output: {
      file: "dist/cjs/index.js",
      format: "cjs",
      globals: {
        "@agc-calculators/calculators-core": "agcCalculatorsCore",
        redom: "redom"
      }
    }
  }
];
