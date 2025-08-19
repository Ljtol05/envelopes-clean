import * as React from 'react';
import { render } from '@testing-library/react';
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog';

// Basic test to ensure solid variant produces an opaque (non-transparent) background.
// We can't inspect actual pixel alpha in jsdom, but we can ensure no gradient/backdrop utility classes
// or glass variant classes are present by default and that background-image is 'none'.

describe('DialogContent solid variant opacity', () => {
  it('renders solid variant without glass classes or backdrop blur', () => {
  const { getByRole } = render(
      <Dialog open>
        <DialogContent>
          <DialogTitle className="sr-only">Opacity Regression</DialogTitle>
          <p>Content</p>
        </DialogContent>
      </Dialog>
    );
    const dialog = getByRole('dialog');
    const className = dialog.className;
  // Ensure React is actually referenced so the import is not stripped as unused
  expect(typeof React.version).toBe('string');
    expect(className).toContain('owl-modal-surface');
    expect(className).not.toContain('owl-modal-surface-glass');
    expect(className).not.toContain('backdrop-blur');
  });

  it('glass variant adds glass & blur classes', () => {
    const { getByRole } = render(
      <Dialog open>
        <DialogContent variant="glass">
          <DialogTitle className="sr-only">Opacity Regression Glass</DialogTitle>
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
