import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Title } from '../Title';

describe('Title', () => {
  it('renders h2 by default', () => {
    render(<Title>Heading</Title>);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('renders h1 when as is h1', () => {
    render(<Title as="h1">Heading 1</Title>);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders h3 when as is h3', () => {
    render(<Title as="h3">Heading 3</Title>);
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('renders h4 when as is h4', () => {
    render(<Title as="h4">Heading 4</Title>);
    expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(<Title>Test Heading</Title>);
    expect(screen.getByText('Test Heading')).toBeInTheDocument();
  });
});
