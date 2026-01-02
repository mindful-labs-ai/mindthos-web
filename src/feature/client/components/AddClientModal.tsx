import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Input } from '@/components/ui/atoms/Input';
import { Title } from '@/components/ui/atoms/Title';
import { FormField } from '@/components/ui/composites/FormField';
import { Modal } from '@/components/ui/composites/Modal';

import { useAddClientForm } from '../hooks/useAddClientForm';
import type { Client } from '../types';

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Client | null;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  open,
  onOpenChange,
  initialData = null,
}) => {
  const isEditMode = !!initialData;
  const form = useAddClientForm(initialData);

  const handleClose = () => {
    form.resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    const success = await form.handleSubmit(e);
    if (success) {
      handleClose();
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-lg text-left"
      closeOnOverlay={false}
    >
      <form onSubmit={handleSubmit} className="space-y-6 py-4">
        <div className="flex items-start justify-between">
          <Title as="h2" className="px-6 text-2xl font-bold">
            {isEditMode ? '클라이언트 정보 수정' : '새로운 클라이언트 등록하기'}
          </Title>
        </div>

        <div className="space-y-4 px-6">
          <FormField label="이름" required error={form.errors.name}>
            <Input
              type="text"
              placeholder="홍길동"
              value={form.formData.name}
              onChange={(e) => form.handleChange('name', e.target.value)}
              maxLength={12}
              error={!!form.errors.name}
            />
          </FormField>

          <FormField label="휴대폰 번호" error={form.errors.phone_number}>
            <Input
              type="tel"
              placeholder="010-1234-5678"
              value={form.formData.phone_number}
              onChange={form.handlePhoneChange}
              maxLength={13}
              error={!!form.errors.phone_number}
            />
          </FormField>

          <FormField label="이메일 주소" error={form.errors.email}>
            <Input
              type="email"
              placeholder="hong@gmail.com"
              value={form.formData.email}
              onChange={(e) => form.handleChange('email', e.target.value)}
              error={!!form.errors.email}
            />
          </FormField>

          <FormField label="상담 주제" error={form.errors.counsel_theme}>
            <Input
              type="text"
              placeholder="친구 관계, 가족 갈등, 부부 관계"
              value={form.formData.counsel_theme}
              onChange={(e) =>
                form.handleChange('counsel_theme', e.target.value)
              }
              maxLength={100}
              error={!!form.errors.counsel_theme}
            />
          </FormField>

          <FormField label="회기 수" error={form.errors.counsel_number}>
            <Input
              type="text"
              placeholder="12"
              value={form.formData.counsel_number}
              onChange={(e) =>
                form.handleChange(
                  'counsel_number',
                  parseInt(e.target.value, 10) || 0
                )
              }
              error={!!form.errors.counsel_number}
            />
          </FormField>

          <FormField label="메모 (동반인 정보)" error={form.errors.memo}>
            <Input
              type="text"
              placeholder="동반인: 김철수, 이영희"
              value={form.formData.memo}
              onChange={(e) => form.handleChange('memo', e.target.value)}
              maxLength={200}
              error={!!form.errors.memo}
            />
          </FormField>
        </div>

        {form.submitError && (
          <div
            className="mx-6 rounded-[var(--radius-md)] bg-danger px-4 py-3 text-sm text-danger"
            role="alert"
          >
            {form.submitError}
          </div>
        )}

        <div className="flex justify-center px-6 pt-4">
          <Button
            type="submit"
            variant="solid"
            tone="primary"
            size="lg"
            className="w-full max-w-md"
            disabled={form.isSubmitting}
          >
            {form.isSubmitting
              ? isEditMode
                ? '수정 중...'
                : '등록 중...'
              : isEditMode
                ? '정보 수정'
                : '클라이언트 등록'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
