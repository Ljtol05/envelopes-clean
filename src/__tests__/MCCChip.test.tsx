import React from 'react';
void React;
import { render, screen } from '@testing-library/react';
import { MCCChip } from '../components/domain/MCCChip';

describe('MCCChip', () => {
  it('renders provided MCC code and data attribute on wrapper', () => {
    const { container } = render(<MCCChip mccCode="5411" data-mcc="5411" />);
    const textEl = screen.getByText(/mcc:5411/);
    expect(textEl).toBeInTheDocument();
    const wrapper = textEl.closest('span')?.parentElement || textEl.parentElement;
    expect(wrapper).toHaveAttribute('data-mcc', '5411');
    // Alternate: direct query
    expect(container.querySelector('[data-mcc="5411"]')).not.toBeNull();
  });
});
