import { Suspense } from 'react';
import HomePage from './HomePageClient';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-franca-green via-white to-franca-green-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-franca-blue mx-auto mb-4"></div>
          <p className="text-franca-blue font-semibold">Carregando...</p>
        </div>
      </div>
    }>
      <HomePage />
    </Suspense>
  );
}
