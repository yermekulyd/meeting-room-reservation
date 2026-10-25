"use client";

import { useState } from "react";

import {
  type Booking,
  type BookingDraft,
  formatDateInTimeZone,
} from "../model/booking";
import { useBookings } from "../model/use-bookings";
import { BookingForm } from "./booking-form";
import { BookingList } from "./booking-list";

type BookingPageProps = {
  timeZone: string;
};

const MANUAL_REFRESH_MIN_DURATION_MS = 700;

export function BookingPage({ timeZone }: BookingPageProps) {
  const [selectedDate, setSelectedDate] = useState(() =>
    formatDateInTimeZone(new Date(), timeZone),
  );
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const {
    bookings,
    loading,
    error,
    reload,
    createBooking,
    updateBooking,
    deleteBooking,
  } = useBookings(selectedDate);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setEditingBooking(null);
    setNotice(null);
    setOperationError(null);
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking({ ...booking });
    setNotice(null);
    setOperationError(null);
  };

  const handleDelete = async (booking: Booking) => {
    const title = booking.title || "Встреча без названия";

    if (!window.confirm(`Удалить бронирование «${title}»?`)) {
      return;
    }

    setDeletingId(booking.id);
    setNotice(null);
    setOperationError(null);

    try {
      await deleteBooking(booking.id);

      if (editingBooking?.id === booking.id) {
        setEditingBooking(null);
      }

      setNotice("Бронирование удалено.");
    } catch (deleteError) {
      setOperationError(
        deleteError instanceof Error
          ? deleteError.message
          : "Не удалось удалить бронирование.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = (draft: BookingDraft) =>
    editingBooking
      ? updateBooking(editingBooking.id, draft)
      : createBooking(draft);

  const handleSaved = () => {
    setNotice(
      editingBooking ? "Бронирование обновлено." : "Бронирование создано.",
    );
    setEditingBooking(null);
    setOperationError(null);
  };

  const handleManualRefresh = async () => {
    setNotice(null);
    setOperationError(null);
    setManualRefreshing(true);

    await Promise.all([
      reload(),
      new Promise<void>((resolve) =>
        window.setTimeout(resolve, MANUAL_REFRESH_MIN_DURATION_MS),
      ),
    ]);

    setManualRefreshing(false);
  };

  const scheduleLoading = loading || manualRefreshing;

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
                  handleDateChange(event.target.value);
                }
              }}
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-950 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-48"
            />
          </div>
        </header>

        {notice && (
          <p
            role="status"
            className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {notice}
          </p>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section
            aria-labelledby="schedule-title"
            aria-busy={scheduleLoading}
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
              <div className="flex items-center gap-2">
                <span
                  aria-label={`Бронирований: ${bookings.length}`}
                  className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600"
                >
                  {bookings.length}
                </span>
                <button
                  type="button"
                  disabled={scheduleLoading}
                  onClick={() => void handleManualRefresh()}
                  className="min-w-24 cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:text-slate-400"
                >
                  {scheduleLoading ? "Обновляем…" : "Обновить"}
                </button>
              </div>
            </div>

            <BookingList
              date={selectedDate}
              bookings={bookings}
              loading={scheduleLoading}
              errorMessage={operationError ?? error?.message}
              deletingId={deletingId ?? undefined}
              onRetry={() => {
                setOperationError(null);
                void reload();
              }}
              onEdit={handleEdit}
              onDelete={(booking) => void handleDelete(booking)}
            />
          </section>

          <BookingForm
            key={`${selectedDate}:${editingBooking?.id ?? "create"}`}
            date={selectedDate}
            timeZone={timeZone}
            bookings={bookings}
            editingBooking={editingBooking ?? undefined}
            disabled={
              Boolean(error) || (scheduleLoading && bookings.length === 0)
            }
            onSave={handleSave}
            onSaved={handleSaved}
            onCancelEdit={() => setEditingBooking(null)}
            onConflict={reload}
          />
        </div>
      </div>
    </main>
  );
}
