export type EnvelopeId = string;
export interface Envelope {
  envelope_id: EnvelopeId;
  name: string;
  balance_cents: number;
}
