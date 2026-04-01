import React from 'react';

import type { TitleEditState } from '@/widgets/session/SessionHeader';

interface UseTitleEditOptions {
  title: string;
  onTitleUpdate?: (newTitle: string) => Promise<void>;
}

export const useTitleEdit = ({
  title,
  onTitleUpdate,
}: UseTitleEditOptions): TitleEditState => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedTitle, setEditedTitle] = React.useState(title);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  const handleSave = React.useCallback(async () => {
    if (!onTitleUpdate || editedTitle.trim() === title) {
      setIsEditing(false);
      setEditedTitle(title);
      return;
    }

    try {
      setIsSaving(true);
      await onTitleUpdate(editedTitle.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('제목 업데이트 실패:', error);
      setEditedTitle(title);
    } finally {
      setIsSaving(false);
    }
  }, [onTitleUpdate, editedTitle, title]);

  const handleCancel = React.useCallback(() => {
    setEditedTitle(title);
    setIsEditing(false);
  }, [title]);

  const startEditing = React.useCallback(() => {
    setIsEditing(true);
  }, []);

  return {
    isEditing,
    editedTitle,
    isSaving,
    setEditedTitle,
    handleSave,
    handleCancel,
    startEditing,
  };
};
