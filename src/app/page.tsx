import { Suspense } from "react";

import { BookingPage } from "@/features/booking";
import { getRoomTimeZone } from "@/features/booking/config/booking-config";

export default function Home() {
  const timeZone = getRoomTimeZone();

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
      <BookingPage timeZone={timeZone} />
    </Suspense>
  );
}
