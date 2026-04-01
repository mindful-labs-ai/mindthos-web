import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Input } from '../../atoms/Input';
import { FormField } from '../FormField';

describe('FormField', () => {
  it('renders label', () => {
    render(
      <FormField label="Email">
        <Input />
      </FormField>
    );
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(
      <FormField label="Email" required>
        <Input />
      </FormField>
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(
      <FormField label="Email" error="Invalid email">
        <Input />
      </FormField>
    );
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('error has role alert', () => {
    render(
      <FormField label="Email" error="Error message">
        <Input />
      </FormField>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('displays helper text', () => {
    render(
      <FormField label="Password" helperText="At least 8 characters">
        <Input />
      </FormField>
    );
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
  });

  it('hides helper text when error is shown', () => {
    render(
      <FormField label="Email" helperText="Helper" error="Error">
        <Input />
      </FormField>
    );
    expect(screen.queryByText('Helper')).not.toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('links label to input with htmlFor', () => {
    render(
      <FormField label="Email">
        <Input />
      </FormField>
    );
    const label = screen.getByText('Email');
    const input = screen.getByRole('textbox');
    expect(label).toHaveAttribute('for', input.id);
  });
});
