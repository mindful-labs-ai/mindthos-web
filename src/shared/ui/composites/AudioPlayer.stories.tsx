import type { Meta, StoryObj } from '@storybook/react';

import { AudioPlayer } from './AudioPlayer';

const meta = {
  title: 'Composites/AudioPlayer',
  component: AudioPlayer,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AudioPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Using a public domain audio sample URL
const sampleAudioUrl =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

export const Default: Story = {
  args: {
    src: sampleAudioUrl,
  },
  render: (args) => (
    <div className="w-[400px]">
      <AudioPlayer {...args} />
    </div>
  ),
};

export const WithTitle: Story = {
  args: {
    src: sampleAudioUrl,
    title: 'Sample Audio Track',
  },
  render: (args) => (
    <div className="w-[400px]">
      <AudioPlayer {...args} />
    </div>
  ),
};

export const WithTimecode: Story = {
  args: {
    src: sampleAudioUrl,
    title: 'Episode 1: Introduction',
    timecode: true,
  },
  render: (args) => (
    <div className="w-[400px]">
      <AudioPlayer {...args} />
    </div>
  ),
};

export const WithCallbacks: Story = {
  args: {
    src: sampleAudioUrl,
    title: 'Track with Events',
    timecode: true,
    onPlay: () => console.log('Playing'),
    onPause: () => console.log('Paused'),
    onSeek: (time) => console.log('Seeked to:', time),
  },
  render: (args) => (
    <div className="w-[400px]">
      <AudioPlayer {...args} />
    </div>
  ),
};

export const Multiple: Story = {
  render: () => (
    <div className="flex w-[400px] flex-col gap-4">
      <AudioPlayer src={sampleAudioUrl} title="Track 1" timecode />
      <AudioPlayer src={sampleAudioUrl} title="Track 2" timecode />
      <AudioPlayer src={sampleAudioUrl} title="Track 3" timecode />
    </div>
  ),
};
