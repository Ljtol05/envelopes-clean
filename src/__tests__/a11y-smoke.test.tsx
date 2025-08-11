import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ThemeProvider } from '../theme';
import { Button } from '../components/ui/button';

// extend expect for types (jest-axe auto extends via import in setup but keep TS happy)
expect.extend(toHaveNoViolations);

describe('accessibility smoke', () => {
  it('button has no a11y violations', async () => {
  expect(React).toBeDefined();
    const { container } = render(
      <ThemeProvider>
        <Button>Click Me</Button>
      </ThemeProvider>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
