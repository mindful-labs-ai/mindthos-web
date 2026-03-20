import { ROUTES } from '@/app/router/constants';
import { HyperLink, Title } from '@/shared/ui';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-8">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-headline text-fg">404</h1>
        <Title as="h2" className="typo-2xl mb-4">
          페이지를 찾을 수 없습니다
        </Title>
        <p className="typo-m text-muted mb-8">
          요청하신 페이지가 존재하지 않거나 잘못된 경로입니다.
        </p>
        <HyperLink
          underline="hover"
          href={ROUTES.ROOT}
          className="bg-primary-500 typo-m hover:bg-primary-600 inline-block rounded-lg px-6 py-3 font-medium text-primary-fg hover:text-primary-fg"
        >
          홈으로 돌아가기
        </HyperLink>
      </div>
    </div>
  );
};

export default NotFoundPage;
