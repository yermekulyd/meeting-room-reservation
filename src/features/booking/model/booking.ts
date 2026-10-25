export const BOOKING_RULES = {
  workdayStart: "09:00",
  workdayEnd: "18:00",
  minDurationMinutes: 30,
  maxDurationMinutes: 120,
} as const;

export type Booking = {
  id: string;
  date: string;
  start: string;
  end: string;
  title?: string;
};

export type BookingDraft = Omit<Booking, "id">;

export type BookingValidationError =
  | "invalid_time"
  | "invalid_interval"
  | "outside_workday"
  | "duration_too_short"
  | "duration_too_long"
  | "overlap";

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function timeToMinutes(time: string): number | null {
  const match = TIME_PATTERN.exec(time);

  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

export function validateBookingDraft(
  draft: BookingDraft,
  bookings: readonly Booking[],
  bookingIdToIgnore?: string,
): BookingValidationError[] {
  const start = timeToMinutes(draft.start);
  const end = timeToMinutes(draft.end);

  if (start === null || end === null) {
    return ["invalid_time"];
  }

  if (start >= end) {
    return ["invalid_interval"];
  }

  const errors: BookingValidationError[] = [];
  const workdayStart = timeToMinutes(BOOKING_RULES.workdayStart)!;
  const workdayEnd = timeToMinutes(BOOKING_RULES.workdayEnd)!;
  const duration = end - start;

  if (start < workdayStart || end > workdayEnd) {
    errors.push("outside_workday");
  }

  if (duration < BOOKING_RULES.minDurationMinutes) {
    errors.push("duration_too_short");
  }

  if (duration > BOOKING_RULES.maxDurationMinutes) {
    errors.push("duration_too_long");
  }

  const overlaps = bookings.some((booking) => {
    if (booking.id === bookingIdToIgnore || booking.date !== draft.date) {
      return false;
    }

    const bookingStart = timeToMinutes(booking.start);
    const bookingEnd = timeToMinutes(booking.end);

    return (
      bookingStart !== null &&
      bookingEnd !== null &&
      start < bookingEnd &&
      end > bookingStart
    );
  });

  if (overlaps) {
    errors.push("overlap");
  }

  return errors;
}
