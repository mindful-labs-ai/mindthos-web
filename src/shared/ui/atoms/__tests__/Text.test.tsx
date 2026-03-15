import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Text } from '../Text';

describe('Text', () => {
  it('renders children content', () => {
    render(<Text>Sample text</Text>);
    expect(screen.getByText('Sample text')).toBeInTheDocument();
  });

  it('applies muted styling', () => {
    const { container } = render(<Text muted>Muted text</Text>);
    expect(container.firstChild).toHaveClass('text-fg-muted');
  });

  it('applies truncate styling', () => {
    const { container } = render(<Text truncate>Long text</Text>);
    expect(container.firstChild).toHaveClass('truncate');
  });

  it('applies custom className', () => {
    const { container } = render(<Text className="custom">Text</Text>);
    expect(container.firstChild).toHaveClass('custom');
  });
});
