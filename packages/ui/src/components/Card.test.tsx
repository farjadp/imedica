import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card } from './Card.js';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);

    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies outlined styling', () => {
    render(<Card variant="outlined">Card content</Card>);

    expect(screen.getByText('Card content').closest('section')?.className).toContain('border-border');
  });
});
