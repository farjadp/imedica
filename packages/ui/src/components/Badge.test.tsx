import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './Badge.js';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies success styling', () => {
    render(<Badge variant="success">Active</Badge>);

    expect(screen.getByText('Active').className).toContain('bg-success-100');
  });
});
