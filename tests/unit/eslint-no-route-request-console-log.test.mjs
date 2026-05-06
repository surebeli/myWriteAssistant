import { RuleTester } from "eslint";
import { describe, test } from "vitest";

import rule from "../../eslint-rules/no-route-request-console-log.mjs";

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
});

describe("no-route-request-console-log", () => {
  test("rejects route handlers that log request objects", () => {
    ruleTester.run("no-route-request-console-log", rule, {
      valid: [
        "console.log('request started')",
        "logAIRequest('chat.error', { requestId })",
        "console.error(error)",
      ],
      invalid: [
        {
          code: "console.log(req.body)",
          errors: [{ messageId: "noRequestConsoleLog" }],
        },
        {
          code: "console.log(request.headers)",
          errors: [{ messageId: "noRequestConsoleLog" }],
        },
      ],
    });
  });
});
