import { HyperLink, Title } from '@/components/ui';
import { ROUTES } from '@/router/constants';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-8">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-fg">404</h1>
        <Title as="h2" className="mb-4 text-2xl">
          페이지를 찾을 수 없습니다
        </Title>
        <p className="mb-8 text-base text-muted">
          요청하신 페이지가 존재하지 않거나 잘못된 경로입니다.
        </p>
        <HyperLink
          underline="hover"
          href={ROUTES.ROOT}
          className="inline-block rounded-lg bg-primary-500 px-6 py-3 text-base font-medium text-white hover:bg-primary-600 hover:text-white"
        >
          홈으로 돌아가기
        </HyperLink>
      </div>
    </div>
  );
};

export default NotFoundPage;
