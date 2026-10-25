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
      <div aria-label="Загрузка бронирований" className="space-y-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-2xl bg-slate-100"
          />
        ))}
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
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
        <p className="text-base font-medium text-slate-800">Бронирований нет</p>
        <p className="mt-2 text-sm text-slate-500">
          На выбранную дату переговорная пока свободна.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(loading || errorMessage) && (
        <p
          role={errorMessage ? "alert" : "status"}
          className={`rounded-xl px-4 py-3 text-sm ${
            errorMessage
              ? "bg-red-50 text-red-700"
              : "bg-blue-50 text-blue-700"
          }`}
        >
          {errorMessage ?? "Обновляем расписание…"}
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
                disabled={deletingId === booking.id}
                onClick={() => onEdit(booking)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Изменить
              </button>
              <button
                type="button"
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
