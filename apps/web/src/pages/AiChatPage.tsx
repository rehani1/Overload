import { FormEvent, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bot, Send, Trash2, UserRound } from "lucide-react";

import { sendAiChat } from "../api/resources";
import { useAuth } from "../auth/useAuth";
import { PageHeader } from "../components/PageHeader";
import { SectionPanel } from "../components/SectionPanel";
import { getApiErrorMessage } from "../lib/apiClient";
import type { AiChatMessage } from "../types/api";

const maxMessagesForRequest = 12;

export function AiChatPage() {
  const { user } = useAuth();
  const [draft, setDraft] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: "assistant",
      content: `I can help plan training, review nutrition targets, or think through recovery for ${
        user?.goal || "your current goal"
      }.`,
    },
  ]);
  const visibleMessages = useMemo(
    () => messages.filter((message) => message.content.trim()),
    [messages],
  );
  const chatMutation = useMutation({
    mutationFn: sendAiChat,
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error, "Unable to reach Overload AI."));
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();

    if (!content || chatMutation.isPending) {
      return;
    }

    const nextMessages = [...messages, { role: "user" as const, content }];
    setDraft("");
    setErrorMessage(null);
    setMessages(nextMessages);

    chatMutation.mutate(
      {
        messages: nextMessages.slice(-maxMessagesForRequest),
      },
      {
        onSuccess: (response) => {
          setMessages((current) => [
            ...current,
            {
              role: "assistant",
              content: response.message,
            },
          ]);
        },
      },
    );
  }

  function handleClear() {
    setErrorMessage(null);
    chatMutation.reset();
    setMessages([
      {
        role: "assistant",
        content: `I can help plan training, review nutrition targets, or think through recovery for ${
          user?.goal || "your current goal"
        }.`,
      },
    ]);
  }

  return (
    <>
      <PageHeader
        eyebrow="Assistant"
        title="AI"
        actions={
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-overload-border-strong bg-overload-elevated px-3 text-sm font-semibold text-overload-ink shadow-sm transition hover:border-overload-primary"
            type="button"
            onClick={handleClear}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Clear
          </button>
        }
      />

      <SectionPanel title="Overload AI">
        <div className="grid min-h-[620px] grid-rows-[1fr_auto] overflow-hidden rounded-lg border border-overload-border bg-overload-elevated">
          <div className="space-y-4 overflow-y-auto px-4 py-5">
            {visibleMessages.map((message, index) => (
              <ChatBubble key={`${message.role}-${index}`} message={message} />
            ))}
            {chatMutation.isPending ? (
              <div className="flex items-start gap-3">
                <Avatar role="assistant" />
                <div className="rounded-lg border border-overload-border bg-overload-surface px-4 py-3 text-sm font-medium text-overload-muted">
                  Thinking...
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-overload-border bg-overload-surface px-4 py-4">
            {errorMessage ? (
              <div className="mb-3 rounded-lg border border-overload-danger-muted bg-overload-danger-muted px-4 py-3 text-sm font-semibold text-overload-danger">
                {errorMessage}
              </div>
            ) : null}
            <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
              <textarea
                className="min-h-24 flex-1 resize-none rounded-lg border border-overload-border bg-overload-elevated px-4 py-3 text-sm text-overload-ink outline-none transition placeholder:text-overload-muted focus:border-overload-primary focus:ring-4 focus:ring-overload-primary-muted"
                maxLength={4000}
                placeholder="Ask about training, nutrition, recovery, or planning."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-overload-primary px-5 text-sm font-semibold text-overload-onPrimary shadow-sm transition hover:bg-overload-accent disabled:cursor-not-allowed disabled:opacity-60 sm:self-end"
                disabled={!draft.trim() || chatMutation.isPending}
                type="submit"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Send
              </button>
            </form>
          </div>
        </div>
      </SectionPanel>
    </>
  );
}

type ChatBubbleProps = {
  message: AiChatMessage;
};

function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar role={message.role} />
      <div
        className={[
          "max-w-3xl whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-6 shadow-sm",
          isUser
            ? "bg-overload-primary text-overload-onPrimary"
            : "border border-overload-border bg-overload-surface text-overload-ink",
        ].join(" ")}
      >
        {message.content}
      </div>
    </div>
  );
}

type AvatarProps = {
  role: AiChatMessage["role"];
};

function Avatar({ role }: AvatarProps) {
  const isUser = role === "user";

  return (
    <div
      className={[
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
        isUser ? "bg-overload-primary text-overload-onPrimary" : "bg-overload-primary-muted text-overload-primary",
      ].join(" ")}
    >
      {isUser ? (
        <UserRound className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Bot className="h-4 w-4" aria-hidden="true" />
      )}
    </div>
  );
}
