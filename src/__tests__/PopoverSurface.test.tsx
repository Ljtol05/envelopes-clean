import * as React from 'react';
import { render } from '@testing-library/react';
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/popover';

// Ensures popover uses hardened surface class with no glass by default.
describe('Popover surface hardening', () => {
  it('renders popover content with owl-popover-surface class', () => {
  const { baseElement } = render(
      <Popover open>
        <PopoverTrigger asChild><button>Trigger</button></PopoverTrigger>
        <PopoverContent><p>Item</p></PopoverContent>
      </Popover>
    );
  expect(typeof React.version).toBe('string');
    const content = baseElement.querySelector('[data-slot="popover-content"]');
    expect(content).toBeTruthy();
    if (content) {
      const cls = content.className;
      expect(cls).toContain('owl-popover-surface');
      expect(cls).not.toContain('glass');
    }
  });
});
