import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { CheckBox } from '@/components/ui/atoms/CheckBox';
import { Input } from '@/components/ui/atoms/Input';
import { FormField } from '@/components/ui/composites/FormField';

const SignUpForm = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [privacyAccepted, setPrivacyAccepted] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted || !privacyAccepted) {
      alert('약관에 동의해주세요.');
      return;
    }
    // TODO: 회원가입 로직
    console.log('회원가입:', {
      email,
      password,
      termsAccepted,
      privacyAccepted,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <FormField>
          <Input
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-12 text-base"
          />
        </FormField>
        <FormField>
          <Input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="h-12 text-base"
          />
        </FormField>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <CheckBox
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <label htmlFor="terms" className="text-sm text-muted">
              <span>서비스 이용약관에 동의합니다.</span>
              <a
                href="https://rare-puppy-06f.notion.site/1a7dd162832d80939543ce9414b1476b?pvs=4"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary-500 hover:text-primary-600"
              >
                [보기]
              </a>
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <CheckBox
              id="privacy"
              tone="secondary"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
            />
            <label htmlFor="privacy" className="text-sm text-muted">
              <span>개인정보 처리방침에 동의합니다.</span>
              <a
                href="https://rare-puppy-06f.notion.site/17cdd162832d8071b61ce2b96b0d464c?pvs=4"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary-500 hover:text-primary-600"
              >
                [보기]
              </a>
            </label>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        tone="primary"
        size="lg"
        variant="solid"
        disabled={!termsAccepted || !privacyAccepted}
        className="h-12 w-full bg-primary-500 text-base hover:bg-primary-600 disabled:cursor-not-allowed"
      >
        이메일 인증하기
      </Button>
    </form>
  );
};

export default SignUpForm;
