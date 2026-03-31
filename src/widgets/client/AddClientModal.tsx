import React from 'react';

import { useAddClientForm } from '@/features/client/hooks/useAddClientForm';
import type { Client } from '@/features/client/types';
import { trackEvent } from '@/lib/mixpanel';
import { MixpanelEvent } from '@/shared/constants/mixpanelEvents';
import { useDevice } from '@/shared/hooks/useDevice';
import { BackButton } from '@/shared/ui/atoms/BackButton';
import { Button } from '@/shared/ui/atoms/Button';
import { Input } from '@/shared/ui/atoms/Input';
import { Title } from '@/shared/ui/atoms/Title';
import { FormField } from '@/shared/ui/composites/FormField';
import { Modal } from '@/shared/ui/composites/Modal';

interface AddClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Client | null;
  /** 클라이언트 생성 완료 시 콜백 (생성된 클라이언트 ID 전달) */
  onClientCreated?: (clientId: string) => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({
  open,
  onOpenChange,
  initialData = null,
  onClientCreated,
}) => {
  const isEditMode = !!initialData;

  React.useEffect(() => {
    if (open) {
      trackEvent(MixpanelEvent.ClientCreateModalOpen);
    }
  }, [open]);

  const { isMobile, isTablet } = useDevice();
  const isMobileView = isMobile || isTablet;
  const form = useAddClientForm(initialData);

  const handleClose = () => {
    trackEvent(MixpanelEvent.ClientCreateModalClose);
    form.resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    const result = await form.handleSubmit(e);
    if (result) {
      // 생성 모드이고 클라이언트 ID가 있으면 콜백 호출
      if (!isEditMode && typeof result === 'string' && onClientCreated) {
        onClientCreated(result);
      }
      handleClose();
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      className={isMobileView ? 'flex flex-col' : 'max-w-lg text-left'}
      closeOnOverlay={false}
      mobileVariant={isMobileView ? 'fullScreen' : 'center'}
      hideCloseButton={isMobileView}
    >
      <form
        onSubmit={handleSubmit}
        className={isMobileView ? 'flex flex-1 flex-col' : 'space-y-6 py-4'}
      >
        {isMobileView ? (
          <div className="flex h-[67px] items-center gap-3 border-b border-grey-30 px-4 py-3">
            <BackButton onClick={handleClose} />
            <p className="text-m font-medium text-grey-100">
              {isEditMode ? '클라이언트 정보 수정' : '클라이언트 추가하기'}
            </p>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <Title as="h2" className="typo-xl px-6 font-headline">
              {isEditMode
                ? '클라이언트 정보 수정'
                : '새로운 클라이언트 등록하기'}
            </Title>
          </div>
        )}

        <div
          className={
            isMobileView
              ? 'flex-1 space-y-4 overflow-y-auto px-4 py-4 md:px-6'
              : 'space-y-4 px-6'
          }
        >
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
            className="typo-sm mx-6 rounded-md bg-danger px-4 py-3 text-danger"
            role="alert"
          >
            {form.submitError}
          </div>
        )}

        <div
          className={
            isMobileView ? 'px-4 pb-4 md:px-6' : 'flex justify-center px-6 pt-4'
          }
        >
          <Button
            type="submit"
            variant="solid"
            tone="primary"
            size="lg"
            className={isMobileView ? 'w-full' : 'w-full max-w-md'}
            disabled={form.isSubmitting}
          >
            {form.isSubmitting
              ? isEditMode
                ? '수정 중...'
                : '등록 중...'
              : isEditMode
                ? '정보 수정'
                : '클라이언트 추가하기'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
