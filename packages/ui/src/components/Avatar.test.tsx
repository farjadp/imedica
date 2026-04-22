import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Avatar } from './Avatar.js';

describe('Avatar', () => {
  it('renders initials fallback when no image source is provided', () => {
    render(<Avatar alt="Jane Doe" />);

    expect(screen.getByLabelText('Jane Doe')).toHaveTextContent('JD');
  });

  it('renders an image when src is provided', () => {
    render(<Avatar alt="Jane Doe" src="/avatar.png" />);

    expect(screen.getByAltText('Jane Doe')).toHaveAttribute('src', '/avatar.png');
  });
});
