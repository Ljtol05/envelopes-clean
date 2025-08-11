import React from 'react';
void React;
import { render, screen } from '@testing-library/react';
import { ReasonChip } from '../components/domain/ReasonChip';

describe('ReasonChip', () => {
  const reasons = [
    'mcc_match',
    'geofence',
    'user_active',
    'rule_match',
    'fallback_general_pool',
    'fallback_buffer',
  ] as const;

  test.each(reasons)('renders correct label for %s', (reason) => {
    render(<ReasonChip reason={reason} data-reason={reason} />);
    const el = screen.getByText(/MCC Match|Location|Active Choice|Rule Applied|General Pool|Buffer Used/);
    expect(el).toHaveAttribute('data-reason', reason);
  });
});
