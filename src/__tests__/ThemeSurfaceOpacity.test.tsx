import * as React from 'react';
import { render } from '@testing-library/react';
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '../components/ui/popover';

// Basic theme smoke test: ensure no transparent surfaces in light or dark theme roots.
function mount(theme: 'light' | 'dark') {
  const Utils = () => (
    <div data-theme={theme}>
      <Dialog open>
        <DialogContent>
          <DialogTitle className="sr-only">Theme {theme}</DialogTitle>
          <p>Dialog {theme}</p>
        </DialogContent>
      </Dialog>
      <Popover open>
        <PopoverTrigger asChild><button>Trigger</button></PopoverTrigger>
        <PopoverContent><p>Popover {theme}</p></PopoverContent>
      </Popover>
    </div>
  );
  return render(<Utils />);
}

describe('Theme surfaces solid backgrounds', () => {
  (['light','dark'] as const).forEach(theme => {
    it(`${theme} theme dialog & popover surfaces are not transparent`, () => {
      const { baseElement } = mount(theme);
      expect(typeof React.version).toBe('string');
      const dialog = baseElement.querySelector('[data-slot="dialog-content"]');
      const pop = baseElement.querySelector('[data-slot="popover-content"]');
      for (const el of [dialog, pop]) {
        expect(el).toBeTruthy();
        if (el) {
          const cls = (el as HTMLElement).className;
          expect(cls).toMatch(/owl-(modal|popover)-surface/);
        }
      }
    });
  });
});
