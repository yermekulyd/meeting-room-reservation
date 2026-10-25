import type { Booking } from "../model/booking";

type BookingListProps = {
  date: string;
  bookings: readonly Booking[];
  loading: boolean;
  errorMessage?: string;
  deletingId?: string;
  onRetry: () => void;
  onEdit: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
};

export function BookingList({
  date,
  bookings,
  loading,
  errorMessage,
  deletingId,
  onRetry,
  onEdit,
  onDelete,
}: BookingListProps) {
  if (loading && bookings.length === 0) {
    return (
      <div
        aria-label="Загрузка бронирований"
        className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-6 text-center"
      >
        <span
          aria-hidden="true"
          className="size-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"
        />
        <p className="mt-3 text-sm font-medium text-blue-700" role="status">
          Обновляем расписание…
        </p>
      </div>
    );
  }

  if (errorMessage && bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <p role="alert" className="text-sm text-red-700">
          {errorMessage}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 text-sm font-semibold text-red-700 underline underline-offset-4"
        >
          Повторить
        </button>
      </div>
    );
  }

  if (!loading && bookings.length === 0) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
        <p className="text-base font-medium text-slate-800">Бронирований нет</p>
        <p className="mt-2 text-sm text-slate-500">
          На выбранную дату переговорная пока свободна.
        </p>
      </div>
    );
  }

  return (
    <div>
      {loading && !errorMessage && (
        <p role="status" className="sr-only">
          Обновляем расписание…
        </p>
      )}

      {errorMessage && (
        <p
          role="alert"
          className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errorMessage}
        </p>
      )}

      <ol className="space-y-3">
        {bookings.map((booking) => (
          <li
            key={booking.id}
            className="flex flex-wrap items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="min-w-24 rounded-xl bg-blue-50 px-3 py-2 text-center text-sm font-semibold text-blue-700">
              <time dateTime={`${date}T${booking.start}`}>
                {booking.start}
              </time>
              <span aria-hidden="true">–</span>
              <time dateTime={`${date}T${booking.end}`}>{booking.end}</time>
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <p className="truncate font-medium text-slate-950">
                {booking.title || "Встреча без названия"}
              </p>
              <p className="mt-1 text-sm text-slate-500">Переговорная комната</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                aria-label={`Изменить бронирование «${booking.title || "Без названия"}»`}
                disabled={deletingId === booking.id}
                onClick={() => onEdit(booking)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Изменить
              </button>
              <button
                type="button"
                aria-label={`Удалить бронирование «${booking.title || "Без названия"}»`}
                disabled={deletingId === booking.id}
                onClick={() => onDelete(booking)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingId === booking.id ? "Удаляем…" : "Удалить"}
              </button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
