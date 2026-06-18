"use client";

import { FormEvent, useMemo, useState } from "react";
import { Bot, Send, UserRound } from "lucide-react";

import { API_BASE_URL, api } from "../../lib/api";
import { Button } from "../../components/ui/Button";
import { RequireAuth } from "../../components/RequireAuth";

type AgentResult = {
  workflow: "quotation" | "provider_matching" | "booking" | "general";
  status: "success" | "needs_more_info" | "failed";
  message: string;
  data?: Record<string, unknown>;
  nextAction?: string | null;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: AgentResult;
};

const starterPrompts = [
  "I need AC repair tomorrow morning in Delhi.",
  "Book a plumber under 1000 rupees in Pune.",
  "Need home cleaning service this evening in Mumbai.",
];

/**
 * Formats structured workflow data for a compact chat display.
 * The backend returns JSON so the UI can render deterministic sections.
 * Empty data is hidden to keep normal conversations readable.
 * This makes tool results visible without exposing internal webhook details.
 */
function formatAgentData(data?: Record<string, unknown>) {
  if (!data || Object.keys(data).length === 0) return null;
  return JSON.stringify(data, null, 2);
}

/**
 * Generates a browser-safe conversation id for request grouping.
 * The id is created only on the client and sent to the backend.
 * It does not include secrets or personally sensitive information.
 * n8n can use it to correlate quote, match, and booking steps.
 */
function createConversationId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `conversation-${Date.now()}`;
}

export default function AiAssistantPage() {
  const [conversationId] = useState(createConversationId);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Tell me what service you need, where you need it, and when. I can help with quotes, provider matching, and bookings.",
    },
  ]);

  const canSend = useMemo(() => input.trim().length >= 3 && !isSending, [input, isSending]);

  /**
   * Sends the user's natural language request to the backend AI endpoint.
   * The frontend never calls OpenAI or n8n directly.
   * Loading and error states are kept local for a responsive chat feel.
   * Successful responses are appended as assistant messages.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = input.trim();
    if (!message || isSending) return;

    setError(null);
    setInput("");
    setIsSending(true);
    setMessages((currentMessages) => [
      ...currentMessages,
      { id: `user-${Date.now()}`, role: "user", content: message },
    ]);

    try {
      const response = await api.post<{
        ok: boolean;
        conversationId: string;
        result: AgentResult;
      }>("/api/ai-agent/service-booking", {
        message,
        conversationId,
      });

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.data.result.message,
          result: response.data.result,
        },
      ]);
    } catch (requestError: any) {
      const message =
        requestError?.response?.data?.message ||
        requestError?.message ||
        "The AI assistant could not complete that request. Please try again.";
      const status = requestError?.response?.status;
      const code = requestError?.response?.data?.code;
      const nextAction =
        status === 401
          ? "Please log in again, then retry the booking."
          : `Check that the backend is running at ${API_BASE_URL} and that Gemini/MongoDB are configured.`;
      setError(message);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: message,
          result: {
            workflow: "general",
            status: "failed",
            message,
            data: { status, code, apiBaseUrl: API_BASE_URL },
            nextAction,
          },
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <RequireAuth role="client">
      <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6">
        <header className="flex flex-col gap-3 border-b border-slate-800 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-400">
              DomusVesta AI
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Service workflow assistant
            </h1>
          </div>
          <a className="text-sm text-slate-300 hover:text-sky-400" href="/">
            Back to home
          </a>
        </header>

        <section className="grid flex-1 gap-4 py-5 lg:grid-cols-[1fr_280px]">
          <div className="flex min-h-[620px] flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((message) => {
                const formattedData = formatAgentData(message.result?.data);
                const isAssistant = message.role === "assistant";

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}
                  >
                    {isAssistant ? (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-500 text-slate-950">
                        <Bot className="h-4 w-4" />
                      </div>
                    ) : null}

                    <div
                      className={`max-w-[82%] rounded-lg px-4 py-3 text-sm ${
                        isAssistant
                          ? "border border-slate-800 bg-slate-950 text-slate-100"
                          : "bg-sky-500 text-slate-950"
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-6">{message.content}</p>

                      {message.result ? (
                        <div className="mt-3 border-t border-slate-800 pt-3 text-xs">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded bg-slate-800 px-2 py-1 text-slate-200">
                              {message.result.workflow}
                            </span>
                            <span className="rounded bg-slate-800 px-2 py-1 text-slate-200">
                              {message.result.status}
                            </span>
                          </div>
                          {message.result.nextAction ? (
                            <p className="mt-2 text-slate-400">{message.result.nextAction}</p>
                          ) : null}
                          {formattedData ? (
                            <pre className="mt-3 max-h-52 overflow-auto rounded bg-slate-900 p-3 text-[11px] text-slate-300">
                              {formattedData}
                            </pre>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {!isAssistant ? (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-200">
                        <UserRound className="h-4 w-4" />
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {isSending ? (
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-slate-950">
                    <Bot className="h-4 w-4" />
                  </div>
                  Working through the workflow...
                </div>
              ) : null}
            </div>

            <form className="border-t border-slate-800 p-4" onSubmit={handleSubmit}>
              {error ? (
                <div className="mb-3 rounded-lg border border-rose-900 bg-rose-950/60 px-3 py-2 text-sm text-rose-200">
                  {error}
                </div>
              ) : null}

              <div className="flex gap-2">
                <textarea
                  className="min-h-12 flex-1 resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none focus:border-sky-500"
                  placeholder="Describe the service you need..."
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  rows={2}
                />
                <Button className="h-12 w-12 px-0" disabled={!canSend}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>

          <aside className="space-y-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="text-sm font-semibold text-slate-100">Try a request</h2>
              <div className="mt-3 space-y-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-left text-xs leading-5 text-slate-300 hover:border-sky-500 hover:text-slate-100"
                    onClick={() => setInput(prompt)}
                    type="button"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-xs leading-5 text-slate-400">
              <h2 className="text-sm font-semibold text-slate-100">Workflow coverage</h2>
              <p className="mt-3">
                The assistant extracts booking details with Gemini, ranks verified providers, saves
                the booking, and returns a structured quotation.
              </p>
            </div>
          </aside>
        </section>
      </div>
      </main>
    </RequireAuth>
  );
}
