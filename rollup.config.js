import peerDepsExternal from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";

export default {
  input: "src/index.js",

  // Prevent bundling React
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "react/jsx-dev-runtime"
  ],

  output: [
    {
      file: "dist/index.cjs.js",
      format: "cjs",
      sourcemap: true
    },
    {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: true
    }
  ],

  plugins: [
    peerDepsExternal(), // auto-excludes peer deps
    resolve(),
    commonjs(),
    babel({
      babelHelpers: "runtime",      // IMPORTANT FIX
      presets: [
        ["@babel/preset-env", { modules: false }],
        ["@babel/preset-react", { runtime: "automatic" }]
      ],
      plugins: ["@babel/plugin-transform-runtime"], // REQUIRED
      exclude: "node_modules/**",
      extensions: [".js", ".jsx"]
    })
  ]
};
