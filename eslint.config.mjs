import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import noRouteRequestConsoleLog from "./eslint-rules/no-route-request-console-log.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/app/api/**/route.ts"],
    plugins: {
      local: {
        rules: {
          "no-route-request-console-log": noRouteRequestConsoleLog,
        },
      },
    },
    rules: {
      "local/no-route-request-console-log": "error",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
