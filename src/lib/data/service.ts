// Local data service abstraction for envelopes & accounts
// Future: swap implementation with HTTP adapter matching same interface

export interface Envelope {
  envelope_id: string;
  name: string;
  balance_cents: number;
  spent_this_month_cents: number;
  budget_cents?: number;
}

export interface ExternalAccount {
  id: string;
  name: string;
  balance_cents: number;
  type?: 'checking' | 'savings';
}

export interface TransferResult {
  from_envelope_id: string | null;
  to_envelope_id: string;
  amount_cents: number;
  new_from_balance_cents?: number;
  new_to_balance_cents?: number;
}

export interface CreateEnvelopeInput {
  name: string;
  initial_amount_cents: number;
}

export interface TransferInput {
  from_envelope_id: string | null; // null when adding from external
  to_envelope_id: string;
  amount_cents: number;
}

export interface EnvelopeService {
  getEnvelopes(): Promise<Envelope[]>;
  createEnvelope(input: CreateEnvelopeInput): Promise<Envelope>;
  transfer(input: TransferInput): Promise<TransferResult>;
  getExternalAccounts(): Promise<ExternalAccount[]>;
  resetDemo(): Promise<void>;
  transferFromExternal(input: { external_account_id: string; to_envelope_id: string; amount_cents: number }): Promise<{ external_account_id: string; to_envelope_id: string; amount_cents: number; new_external_balance_cents: number; new_to_balance_cents: number }>;
}

// Storage keys & versioning
const STORAGE_VERSION = 1;
const ENVELOPES_KEY = `envelopes:v${STORAGE_VERSION}`;
const ACCOUNTS_KEY = `accounts:v${STORAGE_VERSION}`;

// Seed data
const seedEnvelopes: Envelope[] = [
  { envelope_id: 'groceries', name: 'Groceries', balance_cents: 42012, spent_this_month_cents: 15000, budget_cents: 50000 },
  { envelope_id: 'dining', name: 'Dining', balance_cents: 8650, spent_this_month_cents: 4200, budget_cents: 12000 },
  { envelope_id: 'gas', name: 'Gas', balance_cents: 11000, spent_this_month_cents: 6800, budget_cents: 15000 },
  { envelope_id: 'bills', name: 'Bills', balance_cents: 124500, spent_this_month_cents: 145000, budget_cents: 200000 },
  { envelope_id: 'buffer', name: 'Buffer', balance_cents: 30000, spent_this_month_cents: 2400, budget_cents: 35000 },
  { envelope_id: 'misc', name: 'Misc', balance_cents: 7500, spent_this_month_cents: 15600, budget_cents: 20000 }
];

const seedAccounts: ExternalAccount[] = [
  { id: 'acct-checking', name: 'Checking Account', balance_cents: 245032, type: 'checking' },
  { id: 'acct-savings', name: 'Savings Account', balance_cents: 1025055, type: 'savings' }
];

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('Persist failed', err);
  }
}

function slugify(name: string) {
  const base = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 24) || `env-${Date.now()}`;
  return base;
}

function ensureUniqueId(existing: Set<string>, base: string) {
  let id = base;
  let i = 1;
  while (existing.has(id)) id = `${base}-${i++}`;
  return id;
}

export const localEnvelopeService: EnvelopeService = {
  async getEnvelopes() {
    const list = load<Envelope[]>(ENVELOPES_KEY, seedEnvelopes);
    return structuredClone(list);
  },
  async createEnvelope(input: CreateEnvelopeInput) {
    const list = load<Envelope[]>(ENVELOPES_KEY, seedEnvelopes);
    const ids = new Set(list.map(e => e.envelope_id));
    const base = slugify(input.name);
    const id = ensureUniqueId(ids, base);
    const envelope: Envelope = {
      envelope_id: id,
      name: input.name,
      balance_cents: input.initial_amount_cents,
      spent_this_month_cents: 0,
      budget_cents: input.initial_amount_cents || 0
    };
    const next = [...list, envelope];
    save(ENVELOPES_KEY, next);
    return structuredClone(envelope);
  },
  async transfer(input: TransferInput) {
    const list = load<Envelope[]>(ENVELOPES_KEY, seedEnvelopes);
    const byId = new Map(list.map(e => [e.envelope_id, e] as const));
    if (input.from_envelope_id) {
      const from = byId.get(input.from_envelope_id);
      if (!from) throw new Error('Source envelope not found');
      if (from.balance_cents < input.amount_cents) throw new Error('Insufficient funds');
      from.balance_cents -= input.amount_cents;
    }
    const to = byId.get(input.to_envelope_id);
    if (!to) throw new Error('Destination envelope not found');
    to.balance_cents += input.amount_cents;
    save(ENVELOPES_KEY, Array.from(byId.values()));
    return {
      from_envelope_id: input.from_envelope_id,
      to_envelope_id: input.to_envelope_id,
      amount_cents: input.amount_cents,
      new_from_balance_cents: input.from_envelope_id ? byId.get(input.from_envelope_id)?.balance_cents : undefined,
      new_to_balance_cents: to.balance_cents
    } satisfies TransferResult;
  },
  async getExternalAccounts() {
    return structuredClone(load<ExternalAccount[]>(ACCOUNTS_KEY, seedAccounts));
  },
  async resetDemo() {
    save(ENVELOPES_KEY, seedEnvelopes);
    save(ACCOUNTS_KEY, seedAccounts);
  },
  async transferFromExternal(input: { external_account_id: string; to_envelope_id: string; amount_cents: number }) {
    const envelopes = load<Envelope[]>(ENVELOPES_KEY, seedEnvelopes);
    const accounts = load<ExternalAccount[]>(ACCOUNTS_KEY, seedAccounts);
    const acct = accounts.find(a => a.id === input.external_account_id);
    if (!acct) throw new Error('External account not found');
    if (acct.balance_cents < input.amount_cents) throw new Error('Insufficient external account funds');
    const env = envelopes.find(e => e.envelope_id === input.to_envelope_id);
    if (!env) throw new Error('Destination envelope not found');
    acct.balance_cents -= input.amount_cents;
    env.balance_cents += input.amount_cents;
    save(ACCOUNTS_KEY, accounts);
    save(ENVELOPES_KEY, envelopes);
    return {
      external_account_id: input.external_account_id,
      to_envelope_id: input.to_envelope_id,
      amount_cents: input.amount_cents,
      new_external_balance_cents: acct.balance_cents,
      new_to_balance_cents: env.balance_cents
    };
  }
};

export type { Envelope as TEnvelope, ExternalAccount as TExternalAccount };
