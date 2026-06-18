const N8N_WEBHOOKS = {
  getQuote: process.env.N8N_GET_QUOTE_WEBHOOK_URL,
  matchProvider: process.env.N8N_MATCH_PROVIDER_WEBHOOK_URL,
  bookService: process.env.N8N_BOOK_SERVICE_WEBHOOK_URL,
};

/**
 * Sends a workflow payload to the configured n8n webhook.
 * The function keeps webhook authentication server-side only.
 * It also normalizes failed n8n responses into regular errors.
 * Controllers can then return clean API errors to the frontend.
 */
export async function callN8nWebhook(workflowName, payload) {
  const webhookUrl = N8N_WEBHOOKS[workflowName];

  if (!webhookUrl) {
    throw new Error(`Missing n8n webhook URL for ${workflowName}`);
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.N8N_WEBHOOK_SECRET
        ? { "x-domusvesta-secret": process.env.N8N_WEBHOOK_SECRET }
        : {}),
    },
    body: JSON.stringify({
      source: "domusvesta-ai-agent",
      workflowName,
      payload,
    }),
  });

  const responseText = await response.text();
  const responseBody = responseText ? JSON.parse(responseText) : {};

  if (!response.ok) {
    throw new Error(
      responseBody?.message || `n8n ${workflowName} workflow failed`
    );
  }

  return responseBody;
}
