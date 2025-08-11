import React from 'react';
// Tiny reference to avoid unused var lint
void React;
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';

describe('Dialog component', () => {
  test('opens via trigger and closes via close button', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogTitle>My Title</DialogTitle>
          <DialogDescription>Description text</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(screen.getByText('Open Dialog'));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('My Title');
    expect(dialog).toHaveTextContent('Description text');

    await user.click(screen.getByRole('button', { name: /close/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  test('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Esc Test</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    await user.click(screen.getByText('Open'));
    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
