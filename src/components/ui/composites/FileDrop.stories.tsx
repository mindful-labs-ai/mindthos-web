import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { FileDrop } from './FileDrop';

const meta = {
  title: 'Composites/FileDrop',
  component: FileDrop,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FileDrop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onFilesSelected: (files) => {
      console.log('Selected files:', files);
      alert(`Selected ${files.length} file(s): ${files.map((f) => f.name).join(', ')}`);
    },
  },
  render: (args) => (
    <div className="w-[400px]">
      <FileDrop {...args} />
    </div>
  ),
};

export const ImagesOnly: Story = {
  args: {
    accept: 'image/*',
    onFilesSelected: (files) => {
      console.log('Selected images:', files);
    },
  },
  render: (args) => (
    <div className="w-[400px]">
      <FileDrop {...args} />
    </div>
  ),
};

export const PDFOnly: Story = {
  args: {
    accept: '.pdf',
    onFilesSelected: (files) => {
      console.log('Selected PDF:', files);
    },
  },
  render: (args) => (
    <div className="w-[400px]">
      <FileDrop {...args} />
    </div>
  ),
};

export const MultipleFiles: Story = {
  args: {
    multiple: true,
    accept: 'image/*,.pdf',
    onFilesSelected: (files) => {
      console.log('Selected files:', files);
    },
  },
  render: (args) => (
    <div className="w-[400px]">
      <FileDrop {...args} />
    </div>
  ),
};

export const WithSizeLimit: Story = {
  args: {
    accept: 'image/*',
    maxSize: 2 * 1024 * 1024, // 2MB
    onFilesSelected: (files) => {
      console.log('Valid files:', files);
    },
    onError: (error) => {
      console.error(error);
      alert(error);
    },
  },
  render: (args) => (
    <div className="w-[400px]">
      <FileDrop {...args} />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => (
    <div className="w-[400px]">
      <FileDrop {...args} />
    </div>
  ),
};

export const CustomContent: Story = {
  args: {
    accept: 'image/*',
    multiple: true,
    onFilesSelected: (files) => {
      console.log('Selected files:', files);
    },
  },
  render: (args) => (
    <div className="w-[400px]">
      <FileDrop {...args}>
        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-primary/10 p-4">
            <svg
              className="h-8 w-8 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-fg">Upload Images</p>
            <p className="text-xs text-fg-muted">PNG, JPG up to 10MB</p>
          </div>
        </div>
      </FileDrop>
    </div>
  ),
};

export const WithPreview: Story = {
  render: () => {
    const Component = () => {
      const [files, setFiles] = useState<File[]>([]);
      const [previews, setPreviews] = useState<string[]>([]);

      const handleFilesSelected = (selectedFiles: File[]) => {
        setFiles(selectedFiles);

        // Generate previews for images
        const newPreviews: string[] = [];
        selectedFiles.forEach((file) => {
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
              newPreviews.push(reader.result as string);
              if (newPreviews.length === selectedFiles.length) {
                setPreviews(newPreviews);
              }
            };
            reader.readAsDataURL(file);
          }
        });
      };

      return (
        <div className="w-[400px] space-y-4">
          <FileDrop
            accept="image/*"
            multiple
            onFilesSelected={handleFilesSelected}
          />
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-fg">
                Selected {files.length} file(s):
              </p>
              <div className="grid grid-cols-3 gap-2">
                {previews.map((preview, index) => (
                  <div
                    key={index}
                    className="aspect-square overflow-hidden rounded-lg border-2 border-border"
                  >
                    <img
                      src={preview}
                      alt={files[index].name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <ul className="text-xs text-fg-muted">
                {files.map((file, index) => (
                  <li key={index}>
                    {file.name} ({Math.round(file.size / 1024)}KB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    };
    return <Component />;
  },
};

export const WithValidation: Story = {
  render: () => {
    const Component = () => {
      const [error, setError] = useState<string>('');
      const [success, setSuccess] = useState<string>('');

      return (
        <div className="w-[400px] space-y-4">
          <FileDrop
            accept="image/png,image/jpeg"
            maxSize={1 * 1024 * 1024} // 1MB
            onFilesSelected={(files) => {
              setError('');
              setSuccess(`Successfully uploaded: ${files.map((f) => f.name).join(', ')}`);
            }}
            onError={(err) => {
              setSuccess('');
              setError(err);
            }}
          />
          {error && (
            <div className="rounded-lg border-2 border-danger/20 bg-danger/10 p-3">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-lg border-2 border-success/20 bg-success/10 p-3">
              <p className="text-sm text-success">{success}</p>
            </div>
          )}
        </div>
      );
    };
    return <Component />;
  },
};
