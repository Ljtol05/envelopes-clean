// Shared KYC types used across the frontend.

export type KycStatus = 'pending' | 'approved' | 'rejected' | 'not_started';

/**
 * Fields collected from the user to initiate a KYC review. Only include
 * information required by your BaaS provider; never store or transmit
 * sensitive identifiers that aren't needed. The date of birth is
 * expressed as an ISO string (YYYY-MM-DD) and the Social Security
 * number is limited to the last four digits.
 */
export interface KycFormData {
  legalFirstName: string;
  legalLastName: string;
  dob: string;
  ssnLast4: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
}

/**
 * Response returned from the KYC endpoints. `status` reflects the
 * current state of the review. `providerRef` is an opaque reference to
 * the KYC provider session. `reason` and `updatedAt` are optional
 * fields that may be provided by your backend to explain rejections or
 * indicate when the last status change occurred.
 */
export interface KycStatusResponse {
  status: KycStatus;
  providerRef?: string;
  reason?: string;
  updatedAt?: string;
}
