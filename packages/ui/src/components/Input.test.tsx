// ============================================================================
// File: packages/ui/src/components/Input.test.tsx
// Version: 1.0.0 — 2026-04-22
// Why: Unit tests for the Input primitive.
// Env / Identity: Shared UI package
// ============================================================================

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Input } from './Input.js';

describe('Input', () => {
  it('renders a labeled input', () => {
    render(<Input label="Email" name="email" />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders helper text', () => {
    render(<Input label="Email" helperText="We never share your email." name="email" />);

    expect(screen.getByText('We never share your email.')).toBeInTheDocument();
  });

  it('renders error text and marks the input invalid', () => {
    render(<Input label="Email" error="Email is required" name="email" />);

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders icons when provided', () => {
    render(
      <Input
        label="Search"
        leftIcon={<span data-testid="left-icon" />}
        rightIcon={<span data-testid="right-icon" />}
        name="search"
      />,
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });
});
