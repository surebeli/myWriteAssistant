const REQUEST_NAMES = new Set(["req", "request"]);

const rule = {
  meta: {
    type: "problem",
    docs: {
      description: "disallow console.log of request objects in API routes",
    },
    messages: {
      noRequestConsoleLog: "Do not log request objects from API routes; use logAIRequest with sanitized fields.",
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (!isConsoleLog(node.callee)) {
          return;
        }

        if (node.arguments.some(containsRequestObject)) {
          context.report({
            node,
            messageId: "noRequestConsoleLog",
          });
        }
      },
    };
  },
};

function isConsoleLog(callee) {
  return (
    callee?.type === "MemberExpression" &&
    callee.object?.type === "Identifier" &&
    callee.object.name === "console" &&
    getPropertyName(callee.property) === "log"
  );
}

function containsRequestObject(node) {
  if (!node) {
    return false;
  }

  if (node.type === "Identifier") {
    return REQUEST_NAMES.has(node.name);
  }

  if (node.type === "MemberExpression") {
    return containsRequestObject(node.object);
  }

  if (node.type === "ChainExpression") {
    return containsRequestObject(node.expression);
  }

  return false;
}

function getPropertyName(property) {
  if (!property) {
    return undefined;
  }

  if (property.type === "Identifier") {
    return property.name;
  }

  if (property.type === "Literal" && typeof property.value === "string") {
    return property.value;
  }

  return undefined;
}

export default rule;
