"use client";

import { useState } from "react";

import { formatLocalDate } from "../model/booking";
import { useBookings } from "../model/use-bookings";
import { BookingForm } from "./booking-form";
import { BookingList } from "./booking-list";

export function BookingPage() {
  const [selectedDate, setSelectedDate] = useState(() =>
    formatLocalDate(new Date()),
  );
  const { bookings, loading, error, reload, createBooking } =
    useBookings(selectedDate);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-6 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold text-blue-600">
              Meeting Room
            </p>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Бронирование переговорной
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
              Выберите дату, проверьте расписание и забронируйте свободное
              время.
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <label
              htmlFor="booking-date"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Дата
            </label>
            <input
              id="booking-date"
              type="date"
              required
              value={selectedDate}
              onChange={(event) => {
                if (event.target.value) {
                  setSelectedDate(event.target.value);
                }
              }}
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-48"
            />
          </div>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section
            aria-labelledby="schedule-title"
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                  Расписание
                </p>
                <h2
                  id="schedule-title"
                  className="text-xl font-semibold tracking-tight text-slate-950"
                >
                  Бронирования на день
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
                {bookings.length}
              </span>
            </div>

            <BookingList
              date={selectedDate}
              bookings={bookings}
              loading={loading}
              errorMessage={error?.message}
              onRetry={() => void reload()}
            />
          </section>

          <BookingForm
            key={selectedDate}
            date={selectedDate}
            bookings={bookings}
            disabled={Boolean(error) || (loading && bookings.length === 0)}
            onCreate={createBooking}
            onConflict={reload}
          />
        </div>
      </div>
    </main>
  );
}
