import { Suspense } from "react";

import { BookingPage } from "@/features/booking";

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <p className="text-sm font-medium text-slate-500" role="status">
            Загружаем расписание…
          </p>
        </main>
      }
    >
      <BookingPage />
    </Suspense>
  );
}
