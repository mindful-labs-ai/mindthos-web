import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Combobox } from './Combobox';

const meta = {
  title: 'Composites/Combobox',
  component: Combobox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const frameworks = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'Solid' },
  { value: 'next', label: 'Next.js' },
  { value: 'nuxt', label: 'Nuxt.js' },
  { value: 'remix', label: 'Remix' },
];

const countries = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'kr', label: 'South Korea' },
  { value: 'cn', label: 'China' },
  { value: 'in', label: 'India' },
];

export const Default: Story = {
  args: {
    items: frameworks,
    placeholder: 'Search frameworks...',
  },
  render: (args) => (
    <div className="w-[300px]">
      <Combobox {...args} />
    </div>
  ),
};

export const Controlled: Story = {
  render: () => {
    const Component = () => {
      const [value, setValue] = useState('');
      return (
        <div className="w-[300px] space-y-4">
          <Combobox
            items={frameworks}
            value={value}
            onChange={setValue}
            placeholder="Search frameworks..."
          />
          <p className="text-sm text-fg-muted">Selected: {value || 'None'}</p>
        </div>
      );
    };
    return <Component />;
  },
};

export const ManyItems: Story = {
  args: {
    items: countries,
    placeholder: 'Search countries...',
  },
  render: (args) => (
    <div className="w-[300px]">
      <Combobox {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    items: frameworks,
    disabled: true,
    defaultValue: 'react',
  },
  render: (args) => (
    <div className="w-[300px]">
      <Combobox {...args} />
    </div>
  ),
};

export const CustomFilter: Story = {
  render: () => {
    const customFilter = (items: typeof frameworks, query: string) => {
      const lower = query.toLowerCase();
      // Match from beginning of string
      return items.filter((item) => item.label.toLowerCase().startsWith(lower));
    };

    return (
      <div className="w-[300px] space-y-2">
        <p className="text-xs text-fg-muted">
          Custom filter: matches from start only
        </p>
        <Combobox
          items={frameworks}
          filterFn={customFilter}
          placeholder="Type 'r' to see React, Remix..."
        />
      </div>
    );
  },
};

export const InContext: Story = {
  render: () => {
    const Component = () => {
      const [framework, setFramework] = useState('');
      const [country, setCountry] = useState('');

      return (
        <div className="w-[400px] rounded-lg border-2 border-border bg-surface p-6">
          <h3 className="mb-4 text-lg font-semibold text-fg">
            Developer Survey
          </h3>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="framework-combobox"
                className="mb-1.5 block text-sm font-medium text-fg"
              >
                Favorite Framework
              </label>
              <Combobox
                items={frameworks}
                value={framework}
                onChange={setFramework}
                placeholder="Search frameworks..."
              />
            </div>
            <div>
              <label
                htmlFor="country-combobox"
                className="mb-1.5 block text-sm font-medium text-fg"
              >
                Country
              </label>
              <Combobox
                items={countries}
                value={country}
                onChange={setCountry}
                placeholder="Search countries..."
              />
            </div>
            <button
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface hover:opacity-90 disabled:opacity-50"
              disabled={!framework || !country}
            >
              Submit
            </button>
          </div>
        </div>
      );
    };
    return <Component />;
  },
};

export const LargeDataset: Story = {
  render: () => {
    const largeDataset = Array.from({ length: 100 }, (_, i) => ({
      value: `item-${i + 1}`,
      label: `Item ${i + 1}`,
    }));

    return (
      <div className="w-[300px] space-y-2">
        <p className="text-xs text-fg-muted">100 items with search</p>
        <Combobox items={largeDataset} placeholder="Search 100 items..." />
      </div>
    );
  },
};
