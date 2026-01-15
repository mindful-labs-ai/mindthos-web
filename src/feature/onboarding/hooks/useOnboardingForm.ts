import { useEffect, useState } from 'react';

import { useOnboardingStore } from '@/stores/onboardingStore';

export function useOnboardingForm(userEmail: string) {
  const saveInfo = useOnboardingStore((state) => state.saveInfo);
  const nextStep = useOnboardingStore((state) => state.nextStep);
  const complete = useOnboardingStore((state) => state.complete);

  const [name, setNameState] = useState('');
  const [phone, setPhoneState] = useState('');
  const [selectedOrganization, setSelectedOrganizationState] = useState('');
  const [customOrganization, setCustomOrganizationState] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [writingEffect, setWritingEffect] = useState(false);

  useEffect(() => {
    if (writingEffect) {
      setError('');
    }
  }, [writingEffect]);

  const validateName = (value: string): boolean => {
    const nameRegex = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z\s]+$/;
    return nameRegex.test(value);
  };

  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/[^\d]/g, '');

    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const setName = (value: string) => {
    if (value === '' || validateName(value)) {
      setNameState(value);
      setError('');
    }
  };

  const setPhone = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhoneState(formatted);
    setError('');
  };

  const setSelectedOrganization = (value: string) => {
    setSelectedOrganizationState(value);
    // Clear custom input when switching away from '기타'
    if (value !== '기타') {
      setCustomOrganizationState('');
    }
    setError('');
  };

  const setCustomOrganization = (value: string) => {
    setCustomOrganizationState(value);
    setError('');
  };

  const handleInfoSubmit = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('이름을 입력해주세요.');
      return;
    }

    if (trimmedName.length < 2) {
      setError('이름은 2자 이상 입력해주세요.');
      return;
    }

    if (trimmedName.length > 12) {
      setError('이름은 12자 이하로 입력해주세요.');
      return;
    }

    if (!validateName(trimmedName)) {
      setError('이름은 한글, 영문만 입력 가능합니다.');
      return;
    }

    if (phone.trim()) {
      const phoneNumbers = phone.replace(/[^\d]/g, '');

      if (phoneNumbers.length < 9) {
        setError('올바른 전화번호 형식이 아닙니다.');
        return;
      }

      if (phoneNumbers.length > 11) {
        setError('전화번호는 11자리 이하로 입력해주세요.');
        return;
      }

      const validPrefixes = ['010', '011', '016', '017', '018', '019', '02'];
      const prefix = phoneNumbers.slice(0, 3);
      const prefix2 = phoneNumbers.slice(0, 2);

      if (!validPrefixes.includes(prefix) && !validPrefixes.includes(prefix2)) {
        setError('올바른 전화번호 형식이 아닙니다.');
        return;
      }
    }

    setError('');
    setWritingEffect(true);
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 750));

    try {
      // Use custom organization if '기타' is selected, otherwise use selected value
      const finalOrganization =
        selectedOrganization === '기타'
          ? customOrganization.trim()
          : selectedOrganization;

      await saveInfo(userEmail, {
        name: trimmedName,
        phone_number: phone.trim() || undefined,
        organization: finalOrganization || undefined,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '정보 저장에 실패했습니다.'
      );
    } finally {
      setWritingEffect(false);
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    setIsSubmitting(true);
    try {
      await nextStep();
    } catch (err) {
      setError(err instanceof Error ? err.message : '다음 단계로 이동 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await complete(userEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : '온보딩 완료 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    name,
    setName,
    phone,
    setPhone,
    selectedOrganization,
    setSelectedOrganization,
    customOrganization,
    setCustomOrganization,
    isSubmitting,
    error,
    writingEffect,
    handleInfoSubmit,
    handleNext,
    handleComplete,
  };
}
