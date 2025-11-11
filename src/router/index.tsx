import { createBrowserRouter } from 'react-router-dom';

import App from '@/App';
import AuthPage from '@/feature/auth/page/AuthPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/auth',
    element: <AuthPage />,
    // TODO: Add authentication check - redirect to dashboard if already authenticated
    // loader: async () => {
    //   const isAuthenticated = await checkAuth();
    //   if (isAuthenticated) {
    //     return redirect('/dashboard');
    //   }
    //   return null;
    // },
  },
  // TODO: Add protected routes that require authentication
  // {
  //   path: '/dashboard',
  //   element: <ProtectedRoute><DashboardPage /></ProtectedRoute>,
  //   loader: async () => {
  //     const isAuthenticated = await checkAuth();
  //     if (!isAuthenticated) {
  //       return redirect('/auth');
  //     }
  //     return null;
  //   },
  // },
  //
  // TODO : Add 404 Not Found Page
  // {
  //   path: '*',
  //   element: <NotFound />,
  // },
]);
