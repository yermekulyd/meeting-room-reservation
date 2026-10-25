"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { ApiError } from "../api/bookings-api";
import {
  BOOKING_RULES,
  type Booking,
  type BookingDraft,
  type BookingValidationError,
  getBookingValidationOptions,
  validateBookingDraft,
} from "../model/booking";

type BookingFormProps = {
  date: string;
  timeZone: string;
  bookings: readonly Booking[];
  editingBooking?: Booking;
  disabled: boolean;
  onSave: (draft: BookingDraft) => Promise<Booking>;
  onSaved: (booking: Booking) => void;
  onCancelEdit: () => void;
  onConflict: () => Promise<void>;
};

type FormValues = {
  start: string;
  end: string;
  title: string;
};

const validationMessages: Record<BookingValidationError, string> = {
  invalid_date: "Выберите корректную дату.",
  invalid_time: "Укажите корректное время.",
  invalid_interval: "Время окончания должно быть позже времени начала.",
  outside_workday: "Бронирование должно быть в пределах 09:00–18:00.",
  duration_too_short: "Минимальная длительность — 30 минут.",
  duration_too_long: "Максимальная длительность — 2 часа.",
  date_in_past: "Для прошедшей даты создать бронирование нельзя.",
  time_in_past: "Нельзя бронировать прошедшее время.",
  overlap: "Выбранное время пересекается с существующей бронью.",
};

function minutesToTime(minutes: number): string {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const restMinutes = String(minutes % 60).padStart(2, "0");

  return `${hours}:${restMinutes}`;
}

function getInitialValues(
  date: string,
  timeZone: string,
  editingBooking?: Booking,
  now = new Date(),
): FormValues {
  if (editingBooking) {
    return {
      start: editingBooking.start,
      end: editingBooking.end,
      title: editingBooking.title ?? "",
    };
  }

  const validationOptions = getBookingValidationOptions(now, timeZone);

  if (date !== validationOptions.today) {
    return { start: "09:00", end: "10:00", title: "" };
  }

  const currentMinutes = validationOptions.currentMinutes;
  const roundedStart = Math.ceil((currentMinutes + 1) / 30) * 30;
  const workdayStart = 9 * 60;
  const workdayEnd = 18 * 60;
  const start = Math.max(workdayStart, roundedStart);
  const duration = start + 60 <= workdayEnd ? 60 : 30;

  if (start + duration > workdayEnd) {
    return { start: "17:30", end: "18:00", title: "" };
  }

  return {
    start: minutesToTime(start),
    end: minutesToTime(start + duration),
    title: "",
  };
}

export function BookingForm({
  date,
  timeZone,
  bookings,
  editingBooking,
  disabled,
  onSave,
  onSaved,
  onCancelEdit,
  onConflict,
}: BookingFormProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<FormValues>(() =>
    getInitialValues(date, timeZone, editingBooking),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const now = new Date();
  const validationOptions = getBookingValidationOptions(now, timeZone);
  const creationUnavailable =
    date < validationOptions.today ||
    (date === validationOptions.today &&
      validationOptions.currentMinutes > 17 * 60 + 30);

  useEffect(() => {
    if (editingBooking) {
      titleInputRef.current?.focus();
    }
  }, [editingBooking]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const draft: BookingDraft = {
      date,
      start: values.start,
      end: values.end,
      ...(values.title.trim() ? { title: values.title.trim() } : {}),
    };
    const validationErrors = validateBookingDraft(
      draft,
      bookings,
      {
        ...getBookingValidationOptions(new Date(), timeZone),
        bookingIdToIgnore: editingBooking?.id,
      },
    );

    if (validationErrors.length > 0) {
      setFormError(validationMessages[validationErrors[0]]);
      return;
    }

    setSubmitting(true);

    try {
      const booking = await onSave(draft);

      if (!editingBooking) {
        setValues(getInitialValues(date, timeZone));
      }

      onSaved(booking);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setFormError(
          "Это время уже занято. Расписание обновлено — выберите другой интервал.",
        );
        await onConflict();
      } else if (error instanceof ApiError && error.issues[0]) {
        setFormError(
          validationMessages[error.issues[0]] ??
            "Не удалось сохранить бронирование.",
        );
      } else {
        setFormError("Не удалось сохранить бронирование. Попробуйте ещё раз.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const controlsDisabled = disabled || submitting || creationUnavailable;

  return (
    <section
      aria-labelledby="booking-form-title"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold tracking-[0.16em] text-blue-600 uppercase">
          {editingBooking ? "Редактирование" : "Новая встреча"}
        </p>
        <h2
          id="booking-form-title"
          className="text-xl font-semibold tracking-tight text-slate-950"
        >
          {editingBooking ? "Изменить бронирование" : "Забронировать комнату"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Рабочее время: {BOOKING_RULES.workdayStart}–
          {BOOKING_RULES.workdayEnd}. Продолжительность от 30 минут до 2 часов.
          Часовой пояс: {timeZone}.
        </p>
      </div>

      {creationUnavailable && (
        <p className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900">
          Для этой даты свободное рабочее время уже прошло. Выберите будущую
          дату.
        </p>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="booking-title"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Название встречи
          </label>
          <input
            ref={titleInputRef}
            id="booking-title"
            name="title"
            type="text"
            maxLength={80}
            placeholder="Например, планирование спринта"
            value={values.title}
            disabled={controlsDisabled}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="booking-start"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Начало
            </label>
            <input
              id="booking-start"
              name="start"
              type="time"
              min={BOOKING_RULES.workdayStart}
              max={BOOKING_RULES.workdayEnd}
              step={1800}
              required
              aria-invalid={Boolean(formError)}
              aria-errormessage={formError ? "booking-form-error" : undefined}
              value={values.start}
              disabled={controlsDisabled}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  start: event.target.value,
                }))
              }
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>

          <div>
            <label
              htmlFor="booking-end"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Окончание
            </label>
            <input
              id="booking-end"
              name="end"
              type="time"
              min={BOOKING_RULES.workdayStart}
              max={BOOKING_RULES.workdayEnd}
              step={1800}
              required
              aria-invalid={Boolean(formError)}
              aria-errormessage={formError ? "booking-form-error" : undefined}
              value={values.end}
              disabled={controlsDisabled}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  end: event.target.value,
                }))
              }
              className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>
        </div>

        <div aria-live="polite">
          {formError && (
            <p
              id="booking-form-error"
              role="alert"
              className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
            >
              {formError}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {editingBooking && (
            <button
              type="button"
              disabled={submitting}
              onClick={onCancelEdit}
              className="flex h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Отмена
            </button>
          )}
          <button
            type="submit"
            disabled={controlsDisabled}
            className="flex h-12 flex-1 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting
              ? "Сохраняем…"
              : editingBooking
                ? "Сохранить"
                : "Забронировать"}
          </button>
        </div>
      </form>
    </section>
  );
}
