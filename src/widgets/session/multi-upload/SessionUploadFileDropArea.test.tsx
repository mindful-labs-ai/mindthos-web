import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { MultiFileInfo } from '@/features/session/types';

import { SessionUploadFileDropArea } from './SessionUploadFileDropArea';

const renderDropArea = () => {
  const onFilesSelected = vi.fn();

  const view = render(
    <SessionUploadFileDropArea
      files={[]}
      isMobile={false}
      isTablet={false}
      isDragging={false}
      canAddMore
      maxFiles={1}
      onFilesSelected={onFilesSelected}
      onRemoveFile={vi.fn()}
    />
  );

  return { ...view, onFilesSelected };
};

describe('SessionUploadFileDropArea', () => {
  it('파일 선택 시 선택 파일을 즉시 상위 상태로 전달한다', () => {
    const { container, onFilesSelected } = renderDropArea();
    const file = new File(['audio'], 'real-session.mp3', {
      type: 'audio/mpeg',
    });
    const input = container.querySelector('input[type="file"]');

    expect(input).not.toBeNull();
    expect(input).not.toHaveAttribute('multiple');
    expect(input).toHaveAttribute('accept', expect.stringContaining('.mp3'));

    fireEvent.change(input as HTMLInputElement, {
      target: { files: [file] },
    });

    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it('가상 파일이 준비된 상태에서는 추가 파일 입력을 노출하지 않는다', () => {
    const preparedFile: MultiFileInfo = {
      id: 'prepared',
      file: new File(['audio'], 'virtual-session.mp3', {
        type: 'audio/mpeg',
      }),
      name: 'virtual-session.mp3',
      size: 12_500_000,
      validationStatus: 'valid',
    };

    const { container } = render(
      <SessionUploadFileDropArea
        files={[preparedFile]}
        isMobile={false}
        isTablet={false}
        isDragging={false}
        canAddMore={false}
        allowFileSelection={false}
        maxFiles={1}
        onRemoveFile={vi.fn()}
      />
    );

    expect(screen.getByText('virtual-session.mp3')).toBeInTheDocument();
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });
});
