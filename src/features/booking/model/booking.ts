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
  | "invalid_date"
  | "invalid_time"
  | "invalid_interval"
  | "outside_workday"
  | "duration_too_short"
  | "duration_too_long"
  | "date_in_past"
  | "time_in_past"
  | "overlap";

export type BookingValidationOptions = {
  today: string;
  currentMinutes: number;
  bookingIdToIgnore?: string;
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isBookingDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function getBookingValidationOptions(
  now: Date,
  timeZone: string,
): BookingValidationOptions {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const getPart = (type: "year" | "month" | "day" | "hour" | "minute") => {
    const part = parts.find((item) => item.type === type);

    if (!part) {
      throw new Error(`Unable to format booking time part: ${type}`);
    }

    return part.value;
  };

  return {
    today: `${getPart("year")}-${getPart("month")}-${getPart("day")}`,
    currentMinutes:
      Number(getPart("hour")) * 60 + Number(getPart("minute")),
  };
}

export function formatDateInTimeZone(date: Date, timeZone: string): string {
  return getBookingValidationOptions(date, timeZone).today;
}

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
  options: BookingValidationOptions,
): BookingValidationError[] {
  if (!isBookingDate(draft.date)) {
    return ["invalid_date"];
  }

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

  if (draft.date < options.today) {
    errors.push("date_in_past");
  } else if (
    draft.date === options.today &&
    start < options.currentMinutes
  ) {
    errors.push("time_in_past");
  }

  const overlaps = bookings.some((booking) => {
    if (
      booking.id === options.bookingIdToIgnore ||
      booking.date !== draft.date
    ) {
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
