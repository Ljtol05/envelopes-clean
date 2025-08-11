import React from 'react';
void React; // satisfy classic runtime if needed
import { render, screen } from '@testing-library/react';
import { Button } from '../components/ui/button';
import { buttonVariants } from '../components/ui/button.variants';

// Small helper to extract classes for a given variant+size pair
type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type Size = 'default' | 'sm' | 'lg' | 'icon';
function classesFor(variant?: Variant, size?: Size) {
  return buttonVariants({ variant, size });
}

describe('Button', () => {
  it('renders default variant and size', () => {
    render(<Button>Click</Button>);
    const btn = screen.getByRole('button', { name: 'Click' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('bg-primary');
  });

  it('applies destructive variant', () => {
    render(<Button variant="destructive">Danger</Button>);
    const btn = screen.getByRole('button', { name: 'Danger' });
    expect(btn).toHaveClass('bg-destructive');
  });

  it('applies size=sm', () => {
    render(<Button size="sm">Small</Button>);
    const btn = screen.getByRole('button', { name: 'Small' });
    expect(btn.className).toContain('h-8');
  });

  it('supports asChild rendering', () => {
    render(<Button asChild><a href="#test">Linkish</a></Button>);
    const link = screen.getByRole('link', { name: 'Linkish' });
    expect(link).toBeInTheDocument();
    // data-slot attribute keeps styling hook
    expect(link).toHaveAttribute('data-slot','button');
  });

  it('buttonVariants helper returns combined classes', () => {
    const c = classesFor('outline','lg');
    expect(c).toContain('border');
    expect(c).toContain('h-10');
  });
});
