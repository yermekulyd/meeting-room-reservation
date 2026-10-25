import {
  type Booking,
  type BookingDraft,
  type BookingValidationError,
  type BookingValidationOptions,
  validateBookingDraft,
} from "../model/booking";

export type BookingServiceError =
  | { code: "not_found" }
  | {
      code: "conflict" | "validation_failed";
      issues: BookingValidationError[];
    };

type BookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; error: BookingServiceError };

type DeleteResult = { ok: true } | { ok: false; error: BookingServiceError };

function toServiceError(
  issues: BookingValidationError[],
): BookingServiceError {
  return {
    code: issues.includes("overlap") ? "conflict" : "validation_failed",
    issues,
  };
}

export function createBookingService(
  initialBookings: readonly Booking[] = [],
  createId: () => string = () => crypto.randomUUID(),
) {
  let bookings = [...initialBookings];

  return {
    list(date: string): Booking[] {
      return bookings
        .filter((booking) => booking.date === date)
        .sort((left, right) => left.start.localeCompare(right.start));
    },

    create(
      draft: BookingDraft,
      options: BookingValidationOptions,
    ): BookingResult {
      const issues = validateBookingDraft(draft, bookings, options);

      if (issues.length > 0) {
        return { ok: false, error: toServiceError(issues) };
      }

      const booking = { ...draft, id: createId() };
      bookings = [...bookings, booking];

      return { ok: true, booking };
    },

    update(
      id: string,
      patch: Partial<BookingDraft>,
      options: BookingValidationOptions,
    ): BookingResult {
      const booking = bookings.find((item) => item.id === id);

      if (!booking) {
        return { ok: false, error: { code: "not_found" } };
      }

      const draft: BookingDraft = { ...booking, ...patch };
      const issues = validateBookingDraft(draft, bookings, {
        ...options,
        bookingIdToIgnore: id,
      });

      if (issues.length > 0) {
        return { ok: false, error: toServiceError(issues) };
      }

      const updatedBooking = { ...draft, id };
      bookings = bookings.map((item) =>
        item.id === id ? updatedBooking : item,
      );

      return { ok: true, booking: updatedBooking };
    },

    delete(id: string): DeleteResult {
      if (!bookings.some((booking) => booking.id === id)) {
        return { ok: false, error: { code: "not_found" } };
      }

      bookings = bookings.filter((booking) => booking.id !== id);

      return { ok: true };
    },
  };
}

