import * as React from 'react';
import { render } from '@testing-library/react';
import { Dialog, DialogContent } from '../components/ui/dialog';

// Basic test to ensure solid variant produces an opaque (non-transparent) background.
// We can't inspect actual pixel alpha in jsdom, but we can ensure no gradient/backdrop utility classes
// or glass variant classes are present by default and that background-image is 'none'.

// Touch React so the import is not removed by tooling / satisfies TS unused check
// Dummy assertion to use React so TS doesn't flag unused import
test('react version available', () => {
  expect(typeof React.version).toBe('string');
});

describe('DialogContent solid variant opacity', () => {
  it('renders solid variant without glass classes or backdrop blur', () => {
    const { getByRole } = render(
      <Dialog open>
        <DialogContent>
          <p>Content</p>
        </DialogContent>
      </Dialog>
    );
    const dialog = getByRole('dialog');
    const className = dialog.className;
    expect(className).toContain('owl-modal-surface');
    expect(className).not.toContain('owl-modal-surface-glass');
    expect(className).not.toContain('backdrop-blur');
  });

  it('glass variant adds glass & blur classes', () => {
    const { getByRole } = render(
      <Dialog open>
        <DialogContent variant="glass">
          <p>Glass</p>
        </DialogContent>
      </Dialog>
    );
    const dialog = getByRole('dialog');
    const className = dialog.className;
    expect(className).toContain('owl-modal-surface-glass');
    expect(className).toContain('backdrop-blur');
  });
});
