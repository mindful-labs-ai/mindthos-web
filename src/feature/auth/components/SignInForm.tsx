import React from 'react';

import { Button } from '@/components/ui/atoms/Button';
import { Input } from '@/components/ui/atoms/Input';
import { FormField } from '@/components/ui/composites/FormField';

const SignInForm = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 로그인 로직
    console.log('로그인:', { email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          autoComplete="current-password"
          className="h-12 text-base"
        />
      </FormField>
      <Button
        type="submit"
        size="lg"
        variant="solid"
        tone="primary"
        className="h-12 w-full bg-primary-500 text-base hover:bg-primary-600"
      >
        로그인
      </Button>
    </form>
  );
};

export default SignInForm;
