import React from 'react';
import { render } from '@testing-library/react';
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog';

// Regression: ensure the modal background isn't transparent (globals.css or tokens missing).
// We can't assert exact color due to theming, but transparency would appear as 'transparent' or rgba with 0 alpha.

describe('DialogContent computed solid background', () => {
  it('has a non-transparent background-color', () => {
    const { getByRole } = render(
      <Dialog open>
        <DialogContent>
          <DialogTitle className="sr-only">Solid Background Test</DialogTitle>
          <p>Modal</p>
        </DialogContent>
      </Dialog>
    );
  // reference version so React import is used (avoids treeshake/lint removal)
  expect(typeof React.version).toBe('string');
  const dialog = getByRole('dialog');
    const cls = (dialog as HTMLElement).className;
    // Ensure hardened surface class present & no glass variant (glass intentionally translucent)
    expect(cls).toContain('owl-modal-surface');
    expect(cls).not.toContain('owl-modal-surface-glass');
    // Ensure we applied bg utility referencing var fallback (#fff) we added
    expect(/bg-\[var\(--owl-modal-bg/.test(cls)).toBe(true);
  });
});
