import { useEffect, useMemo, useRef, useState } from "react";
import { askCoach, executeAction, type CoachResponse } from "../lib/api";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { toast } from "sonner";

const SEED_QUESTION = "Tell me your income, current savings, debts, and goals.";
const SESSION_KEY = "coach_messages_v1";

type Msg = { role: "user" | "assistant"; content: string; meta?: Partial<CoachResponse> };

export default function OnboardingCoach() {
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw) as Msg[];
    } catch {
      // ignore restore errors
    }
    return [{ role: "assistant", content: SEED_QUESTION }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
    } catch {
      // ignore persist errors
    }
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const submit = async () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: q };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const res = await askCoach(q, {});
      const meta: Partial<CoachResponse> = {
        suggestedActions: res.suggestedActions,
        analytics: res.analytics,
        isNewUser: res.isNewUser,
      };
      setMessages((m) => [...m, { role: "assistant", content: res.response, meta }]);
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "The coach failed to reply.");
    } finally {
      setLoading(false);
    }
  };

  const hasStats = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.meta?.analytics);
    return last?.meta?.analytics as Record<string, number | string> | undefined;
  }, [messages]);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Chat body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
            <div className={
              m.role === "user"
                ? "inline-block max-w-[85%] rounded-lg px-3 py-2 bg-[color:var(--owl-accent)] text-[color:var(--owl-accent-fg)]"
                : "inline-block max-w-[85%] rounded-lg px-3 py-2 owl-modal-surface border border-[color:var(--owl-modal-border)] shadow-[var(--owl-shadow-popover)]"
            }>
              <p className="whitespace-pre-wrap text-sm">{m.content}</p>
              {m.role === "assistant" && m.meta?.suggestedActions && m.meta.suggestedActions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.meta.suggestedActions.map((a, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await executeAction({ action: a.type || a.label, params: a.payload as Record<string, unknown> | undefined });
                          toast.success("Action executed");
                          // Optionally reflect action result in chat
                          setMessages((msgs) => [...msgs, { role: "assistant", content: `✓ ${a.label}` }]);
                        } catch (e) {
                          const err = e as Error;
                          toast.error(err.message || `Failed to execute: ${a.label}`);
                        }
                      }}
                    >
                      {a.label}
                    </Button>
                  ))}
                </div>
              )}
              {m.role === "assistant" && m.meta?.isNewUser && (
                <Card className="mt-2">
                  <CardContent className="py-2">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span>New here? Start a guided setup.</span>
                      <Button
                        size="sm"
                        onClick={async () => {
                          try {
                            await executeAction({ action: "start_guided_setup" });
                            toast.success("Starting guided setup…");
                          } catch (e) {
                            const err = e as Error;
                            toast.error(err.message || "Failed to start guided setup");
                          }
                        }}
                      >
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ))}

        {hasStats && (
          <div className="mt-4">
            <Card>
              <CardContent className="py-3">
                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  {Object.entries(hasStats).map(([k, v]) => (
                    <div key={k}>
                      <div className="text-[color:var(--owl-text-secondary)]">{k}</div>
                      <div className="font-medium">{String(v)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="sticky bottom-0 bg-[color:var(--owl-bg)]/90 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-t border-[color:var(--owl-border)] p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            disabled={loading}
            placeholder="Ask the coach…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
          />
          <Button onClick={submit} disabled={loading || !input.trim()}>
            {loading ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
