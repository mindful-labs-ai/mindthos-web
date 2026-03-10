import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Pagination } from './Pagination';

const meta = {
  title: 'Composites/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const Component = () => {
      const [currentPage, setCurrentPage] = useState(1);
      return (
        <div className="flex flex-col gap-4">
          <Pagination
            currentPage={currentPage}
            totalPages={10}
            onPageChange={setCurrentPage}
          />
          <p className="text-center text-sm text-fg-muted">
            Page {currentPage} of 10
          </p>
        </div>
      );
    };
    return <Component />;
  },
};

export const ManyPages: Story = {
  render: () => {
    const Component = () => {
      const [currentPage, setCurrentPage] = useState(25);
      return (
        <Pagination
          currentPage={currentPage}
          totalPages={50}
          onPageChange={setCurrentPage}
        />
      );
    };
    return <Component />;
  },
};

export const FewPages: Story = {
  render: () => {
    const Component = () => {
      const [currentPage, setCurrentPage] = useState(2);
      return (
        <Pagination
          currentPage={currentPage}
          totalPages={5}
          onPageChange={setCurrentPage}
        />
      );
    };
    return <Component />;
  },
};

export const WithoutFirstLast: Story = {
  render: () => {
    const Component = () => {
      const [currentPage, setCurrentPage] = useState(5);
      return (
        <Pagination
          currentPage={currentPage}
          totalPages={20}
          onPageChange={setCurrentPage}
          showFirstLast={false}
        />
      );
    };
    return <Component />;
  },
};

export const LargeSiblingCount: Story = {
  render: () => {
    const Component = () => {
      const [currentPage, setCurrentPage] = useState(10);
      return (
        <Pagination
          currentPage={currentPage}
          totalPages={20}
          onPageChange={setCurrentPage}
          siblingCount={2}
        />
      );
    };
    return <Component />;
  },
};

export const Disabled: Story = {
  args: {
    currentPage: 5,
    totalPages: 10,
    onPageChange: () => {},
    disabled: true,
  },
};

export const InContext: Story = {
  render: () => {
    const Component = () => {
      const [currentPage, setCurrentPage] = useState(1);
      const itemsPerPage = 10;
      const totalItems = 95;
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      const startItem = (currentPage - 1) * itemsPerPage + 1;
      const endItem = Math.min(currentPage * itemsPerPage, totalItems);

      return (
        <div className="w-[600px] space-y-4">
          <div className="rounded-lg border-2 border-border bg-surface p-4">
            <h3 className="mb-4 font-semibold text-fg">Items List</h3>
            <div className="space-y-2">
              {Array.from({ length: itemsPerPage }).map((_, i) => {
                const itemNumber = startItem + i;
                if (itemNumber > totalItems) return null;
                return (
                  <div
                    key={itemNumber}
                    className="rounded border border-border bg-surface-contrast p-2 text-sm text-fg"
                  >
                    Item {itemNumber}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-fg-muted">
              Showing {startItem}-{endItem} of {totalItems}
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      );
    };
    return <Component />;
  },
};
