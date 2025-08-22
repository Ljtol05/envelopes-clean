import React from 'react';
import { render } from '@testing-library/react';
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog';

// Regression: ensure overlay receives a non-transparent background color even if CSS vars missing.
describe('Dialog overlay fallback background', () => {
  it('overlay has non-transparent background', () => {
    const { baseElement } = render(
      <Dialog open>
        <DialogContent>
          <DialogTitle className="sr-only">Overlay Test</DialogTitle>
          <p>Overlay Test Body</p>
        </DialogContent>
      </Dialog>
    );
    expect(typeof React.version).toBe('string');
    const overlay = baseElement.querySelector('[data-slot="dialog-overlay"]') as HTMLElement | null;
    expect(overlay).toBeTruthy();
    if (overlay) {
      const cls = overlay.className;
      // Ensure we applied a bg utility with var fallback pattern
      expect(cls).toMatch(/bg-\[/);
      expect(cls).toMatch(/owl-overlay/);
      // Should not inadvertently include glass variant
      expect(cls).not.toContain('glass');
    }
  });
});
