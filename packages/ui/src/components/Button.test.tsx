// ============================================================================
// File: packages/ui/src/components/Button.test.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Unit tests for the Button primitive.
// Env / Identity: Shared UI package
// ============================================================================

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button.js';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Click me' }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);

    expect(screen.getByRole('button', { name: 'Click me' })).toBeDisabled();
  });

  it('shows a loading spinner and disables the button when loading', () => {
    render(<Button isLoading>Click me</Button>);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /click me/i })).toBeDisabled();
  });

  it('renders icons when provided', () => {
    render(
      <Button leftIcon={<span data-testid="left-icon" />} rightIcon={<span data-testid="right-icon" />}>
        Click me
      </Button>,
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies variant and size styling hooks', () => {
    render(
      <Button variant="danger" size="lg">
        Delete
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Delete' });

    expect(button.className).toContain('bg-error-600');
    expect(button.className).toContain('h-12');
  });
});
