import { ROUTES } from '@/app/router/constants';
import { HyperLink, Title } from '@/shared/ui';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-8">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-headline text-fg">404</h1>
        <Title as="h2" className="mb-4 typo-2xl">
          페이지를 찾을 수 없습니다
        </Title>
        <p className="mb-8 typo-m text-muted">
          요청하신 페이지가 존재하지 않거나 잘못된 경로입니다.
        </p>
        <HyperLink
          underline="hover"
          href={ROUTES.ROOT}
          className="inline-block rounded-lg bg-primary-500 px-6 py-3 typo-m font-medium text-primary-fg hover:bg-primary-600 hover:text-primary-fg"
        >
          홈으로 돌아가기
        </HyperLink>
      </div>
    </div>
  );
};

export default NotFoundPage;
