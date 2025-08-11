// Lightweight typed mock API used by the UI while the real backend is wired.

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ===== Types =====
export type EnvelopeId = string;

export interface EnvelopeBalance {
  envelope_id: EnvelopeId;
  name: string;
  balance_cents: number;
}

export interface BalancesResponse {
  account_id: string;
  total_available_cents: number;
  envelopes: EnvelopeBalance[];
}

export interface TransferRequest {
  from_envelope_id: EnvelopeId;
  to_envelope_id: EnvelopeId;
  amount_cents: number;
  memo?: string;
}

export interface TransferResponse {
  ok: boolean;
  transfer_id: string;
  new_balances: BalancesResponse;
  request: TransferRequest; // echo back so callers can reconcile
}

export interface Rule {
  rule_id: string;
  name: string;
  enabled: boolean;
  predicate?: Record<string, unknown>;
  action?: { envelope_id: EnvelopeId };
}

export interface ListRulesResponse {
  user_id: string;
  rules: Rule[];
}

export interface UpsertRuleResponse {
  rule: Rule;
}

export interface ReallocateRequest {
  allocations: { envelope_id: EnvelopeId; amount_cents: number }[];
}

export interface ReallocateResponse {
  ok: boolean;
  allocations: { envelope_id: EnvelopeId; amount_cents: number }[];
}

// ===== API stubs =====
export async function getBalances(account_id: string): Promise<BalancesResponse> {
  await sleep(200);
  return {
    account_id,
    total_available_cents: 223_712,
    envelopes: [
      { envelope_id: "env_groceries", name: "Groceries", balance_cents: 42_012 },
      { envelope_id: "env_dining", name: "Dining", balance_cents: 8_650 },
      { envelope_id: "env_gas", name: "Gas", balance_cents: 11_000 },
      { envelope_id: "env_bills", name: "Bills", balance_cents: 124_500 },
      { envelope_id: "env_buffer", name: "Buffer", balance_cents: 30_000 },
      { envelope_id: "env_misc", name: "Misc", balance_cents: 7_500 },
    ],
  };
}

export async function transfer(req: TransferRequest): Promise<TransferResponse> {
  await sleep(150);
  const new_balances = await getBalances("acct_demo");
  return { ok: true, transfer_id: "tr_mock_1", new_balances, request: req };
}

export async function listRules(user_id: string): Promise<ListRulesResponse> {
  await sleep(150);
  return { user_id, rules: [] };
}

export async function upsertRule(rule: Rule): Promise<UpsertRuleResponse> {
  await sleep(150);
  return { rule: { ...rule, rule_id: rule.rule_id || "rule_mock_1" } };
}

export async function reallocate(req: ReallocateRequest): Promise<ReallocateResponse> {
  await sleep(150);
  return { ok: true, allocations: req.allocations };
}