import { createServer, type IncomingMessage } from "node:http";

type RouteHandler = (request: Request) => Promise<Response> | Response;

export function createNextRouteServer(handler: RouteHandler) {
  return createServer(async (incomingRequest, outgoingResponse) => {
    try {
      const request = await toWebRequest(incomingRequest);
      const response = await handler(request);
      const body = Buffer.from(await response.arrayBuffer());

      outgoingResponse.statusCode = response.status;
      response.headers.forEach((value, key) => {
        outgoingResponse.setHeader(key, value);
      });
      outgoingResponse.end(body);
    } catch (error) {
      outgoingResponse.statusCode = 500;
      outgoingResponse.setHeader("content-type", "application/json");
      outgoingResponse.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Unknown route test error",
        }),
      );
    }
  });
}

async function toWebRequest(incomingRequest: IncomingMessage): Promise<Request> {
  const body = await readBody(incomingRequest);
  const headers = new Headers();

  for (const [key, value] of Object.entries(incomingRequest.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    } else if (typeof value === "string") {
      headers.set(key, value);
    }
  }

  return new Request(`http://localhost${incomingRequest.url ?? "/"}`, {
    method: incomingRequest.method,
    headers,
    body: body.length > 0 ? body.toString("utf8") : undefined,
  });
}

function readBody(incomingRequest: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    incomingRequest.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    incomingRequest.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    incomingRequest.on("error", reject);
  });
}
