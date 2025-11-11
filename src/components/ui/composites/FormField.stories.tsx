import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Input } from '../atoms/Input';
import { TextArea } from '../atoms/TextArea';

import { FormField } from './FormField';

const meta = {
  title: 'Composites/FormField',
  component: FormField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Email',
    children: <Input type="email" placeholder="Enter your email" />,
  },
  render: (args) => (
    <div className="w-[400px]">
      <FormField {...args} />
    </div>
  ),
};

export const Required: Story = {
  args: {
    label: 'Username',
    required: true,
    children: <Input placeholder="Enter username" />,
  },
  render: (args) => (
    <div className="w-[400px]">
      <FormField {...args} />
    </div>
  ),
};

export const WithHelperText: Story = {
  args: {
    label: 'Password',
    helperText: 'Must be at least 8 characters',
    children: <Input type="password" placeholder="Enter password" />,
  },
  render: (args) => (
    <div className="w-[400px]">
      <FormField {...args} />
    </div>
  ),
};

export const WithError: Story = {
  args: {
    label: 'Email',
    error: 'Invalid email format',
    children: <Input type="email" placeholder="Enter your email" />,
  },
  render: (args) => (
    <div className="w-[400px]">
      <FormField {...args} />
    </div>
  ),
};

export const WithTextArea: Story = {
  args: {
    label: 'Description',
    helperText: 'Maximum 500 characters',
    children: <TextArea placeholder="Enter description" rows={4} />,
  },
  render: (args) => (
    <div className="w-[400px]">
      <FormField {...args} />
    </div>
  ),
};

export const FullForm: Story = {
  render: () => {
    const Component = () => {
      const [email, setEmail] = useState('');
      const [password, setPassword] = useState('');
      const [emailError, setEmailError] = useState('');

      const validateEmail = (value: string) => {
        if (!value) {
          setEmailError('Email is required');
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          setEmailError('Invalid email format');
        } else {
          setEmailError('');
        }
      };

      return (
        <div className="w-[400px] space-y-4 rounded-lg border-2 border-border bg-surface p-6">
          <h2 className="text-xl font-bold text-fg">Sign Up</h2>
          <FormField
            label="Email"
            required
            error={emailError}
            helperText={
              !emailError ? "We'll never share your email" : undefined
            }
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateEmail(e.target.value);
              }}
              placeholder="you@example.com"
            />
          </FormField>
          <FormField
            label="Password"
            required
            helperText="Must be at least 8 characters"
          >
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </FormField>
          <FormField label="Bio">
            <TextArea placeholder="Tell us about yourself" rows={3} />
          </FormField>
          <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface hover:opacity-90">
            Create Account
          </button>
        </div>
      );
    };
    return <Component />;
  },
};
