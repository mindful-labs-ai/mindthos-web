import type { Meta, StoryObj } from '@storybook/react';

import { Credit } from './Credit';

const meta = {
  title: 'Composites/Credit',
  component: Credit,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Credit>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    used: 250,
    total: 300,
    label: '사용횟수',
  },
};

export const WithPercentage: Story = {
  args: {
    used: 280,
    total: 300,
    label: 'API Calls',
    showPercentage: true,
  },
};

export const BarVariant: Story = {
  args: {
    used: 150,
    total: 300,
    label: '사용횟수',
    variant: 'bar',
    showPercentage: true,
  },
  render: (args) => (
    <div className="w-[300px]">
      <Credit {...args} />
    </div>
  ),
};

export const MinimalVariant: Story = {
  args: {
    used: 250,
    total: 300,
    label: '사용횟수',
    variant: 'minimal',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Credit used={250} total={300} label="Small" size="sm" />
      <Credit used={250} total={300} label="Medium" size="md" />
      <Credit used={250} total={300} label="Large" size="lg" />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-[400px]">
      <Credit used={250} total={300} label="Default" variant="default" />
      <Credit used={250} total={300} label="Bar" variant="bar" />
      <Credit used={250} total={300} label="Minimal" variant="minimal" />
    </div>
  ),
};

export const UsageStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[300px]">
      <div className="space-y-2">
        <p className="text-xs text-fg-muted">Normal (50%)</p>
        <Credit used={150} total={300} label="사용횟수" variant="bar" showPercentage />
      </div>
      <div className="space-y-2">
        <p className="text-xs text-fg-muted">Warning (85%)</p>
        <Credit used={255} total={300} label="사용횟수" variant="bar" showPercentage />
      </div>
      <div className="space-y-2">
        <p className="text-xs text-fg-muted">Danger (98%)</p>
        <Credit used={294} total={300} label="사용횟수" variant="bar" showPercentage />
      </div>
      <div className="space-y-2">
        <p className="text-xs text-fg-muted">Full (100%)</p>
        <Credit used={300} total={300} label="사용횟수" variant="bar" showPercentage />
      </div>
    </div>
  ),
};

export const CustomThresholds: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[300px]">
      <Credit
        used={150}
        total={300}
        label="Custom Warning at 50%"
        variant="bar"
        warningThreshold={0.5}
        showPercentage
      />
      <Credit
        used={210}
        total={300}
        label="Custom Danger at 70%"
        variant="bar"
        dangerThreshold={0.7}
        showPercentage
      />
    </div>
  ),
};

export const WithoutLabel: Story = {
  args: {
    used: 250,
    total: 300,
  },
};

export const LowUsage: Story = {
  args: {
    used: 10,
    total: 300,
    label: '사용횟수',
    variant: 'bar',
    showPercentage: true,
  },
  render: (args) => (
    <div className="w-[300px]">
      <Credit {...args} />
    </div>
  ),
};

export const HighUsage: Story = {
  args: {
    used: 299,
    total: 300,
    label: '사용횟수',
    variant: 'bar',
    showPercentage: true,
  },
  render: (args) => (
    <div className="w-[300px]">
      <Credit {...args} />
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="w-[400px] space-y-4">
      <div className="rounded-lg border-2 border-border bg-surface p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-fg">내 계정</h3>
            <Credit used={250} total={300} variant="minimal" />
          </div>
          <div className="space-y-3">
            <Credit
              used={250}
              total={300}
              label="API 호출"
              variant="bar"
              showPercentage
            />
            <Credit
              used={180}
              total={200}
              label="이미지 생성"
              variant="bar"
              showPercentage
            />
            <Credit
              used={50}
              total={100}
              label="스토리지"
              variant="bar"
              showPercentage
            />
          </div>
          <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-surface hover:opacity-90">
            크레딧 구매
          </button>
        </div>
      </div>
    </div>
  ),
};

export const AllSizesAllVariants: Story = {
  render: () => (
    <div className="space-y-8 w-[400px]">
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-fg">Small</h4>
        <Credit used={250} total={300} label="Default" size="sm" />
        <Credit used={250} total={300} label="Bar" variant="bar" size="sm" />
        <Credit used={250} total={300} label="Minimal" variant="minimal" size="sm" />
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-fg">Medium</h4>
        <Credit used={250} total={300} label="Default" size="md" />
        <Credit used={250} total={300} label="Bar" variant="bar" size="md" />
        <Credit used={250} total={300} label="Minimal" variant="minimal" size="md" />
      </div>
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-fg">Large</h4>
        <Credit used={250} total={300} label="Default" size="lg" />
        <Credit used={250} total={300} label="Bar" variant="bar" size="lg" />
        <Credit used={250} total={300} label="Minimal" variant="minimal" size="lg" />
      </div>
    </div>
  ),
};
