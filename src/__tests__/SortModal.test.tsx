import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortModal } from '../components/domain/SortModal';

const sampleEnvelopes = [
  { id: 'env1', name: 'Groceries', balance_cents: 5000 },
  { id: 'env2', name: 'Rent', balance_cents: 100000 },
  { id: 'env3', name: 'Fun', balance_cents: 2000 }
];

describe('SortModal', () => {
  it('allocates 50% quick split across two allocations and enables submit when balanced', async () => {
  expect(React).toBeDefined();
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onSort = jest.fn();

    render(
      <SortModal
        isOpen
        onClose={onClose}
        totalAmount={100}
        envelopes={sampleEnvelopes}
        onSort={onSort}
      />
    );

    // Add a second allocation
    await user.click(screen.getByText(/add split/i));

    // Select envelopes for both allocations
    const selects = screen.getAllByLabelText(/select envelope/i);
    await user.selectOptions(selects[0], 'env1');
    await user.selectOptions(selects[1], 'env2');

    // Quick split 50% (first gets 50, second splits remainder -> only one other so also 50)
    await user.click(screen.getByText('50%'));

    // Amount inputs reflect values
    const amountInputs = screen.getAllByPlaceholderText('0.00');
    expect(amountInputs[0]).toHaveValue('50.00');
    expect(amountInputs[1]).toHaveValue('50.00');

    // Submit enabled
    const submit = screen.getByRole('button', { name: /split transaction/i });
    expect(submit).not.toBeDisabled();

    await user.click(submit);
    expect(onSort).toHaveBeenCalledWith([
      { envelope_id: 'env1', amount_cents: 5000 },
      { envelope_id: 'env2', amount_cents: 5000 }
    ]);
    expect(onClose).toHaveBeenCalled();
  });
});
