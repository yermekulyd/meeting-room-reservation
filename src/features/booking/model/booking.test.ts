import { describe, expect, it } from "vitest";

import {
  type Booking,
  type BookingDraft,
  getBookingEndTimeOptions,
  getBookingStartTimeOptions,
  getBookingValidationOptions,
  validateBookingDraft,
} from "./booking";

const draft: BookingDraft = {
  date: "2026-10-26",
  start: "10:00",
  end: "11:00",
  title: "Planning",
};

const existingBooking: Booking = {
  id: "booking-1",
  date: "2026-10-26",
  start: "11:00",
  end: "12:00",
};

const validationOptions = {
  today: "2026-10-25",
  currentMinutes: 9 * 60 + 30,
};

describe("validateBookingDraft", () => {
  it("builds 30-minute start and duration-aware end time options", () => {
    expect(getBookingStartTimeOptions()).toEqual(
      expect.arrayContaining(["09:00", "12:30", "17:30"]),
    );
    expect(getBookingStartTimeOptions()).not.toContain("18:00");
    expect(getBookingEndTimeOptions("16:30")).toEqual([
      { value: "17:00", durationMinutes: 30 },
      { value: "17:30", durationMinutes: 60 },
      { value: "18:00", durationMinutes: 90 },
    ]);
    expect(getBookingEndTimeOptions("17:30")).toEqual([
      { value: "18:00", durationMinutes: 30 },
    ]);
  });

  it("creates deterministic validation options in the room time zone", () => {
    const now = new Date("2026-10-25T20:30:00.000Z");

    expect(getBookingValidationOptions(now, "Asia/Almaty")).toEqual({
      today: "2026-10-26",
      currentMinutes: 90,
    });
  });

  it("accepts a valid booking and allows touching boundaries", () => {
    expect(
      validateBookingDraft(draft, [existingBooking], validationOptions),
    ).toEqual([]);
  });

  it("rejects malformed dates", () => {
    expect(
      validateBookingDraft(
        { ...draft, date: "2026-02-30" },
        [],
        validationOptions,
      ),
    ).toEqual(["invalid_date"]);
  });

  it("rejects malformed time values", () => {
    expect(
      validateBookingDraft(
        { ...draft, start: "9:00" },
        [],
        validationOptions,
      ),
    ).toEqual(["invalid_time"]);
  });

  it("requires the start to be earlier than the end", () => {
    expect(
      validateBookingDraft(
        { ...draft, start: "11:00", end: "11:00" },
        [],
        validationOptions,
      ),
    ).toEqual(["invalid_interval"]);
  });

  it("keeps bookings within the working day", () => {
    expect(
      validateBookingDraft(
        { ...draft, start: "08:30", end: "09:30" },
        [],
        validationOptions,
      ),
    ).toContain("outside_workday");
    expect(
      validateBookingDraft(
        { ...draft, start: "17:30", end: "18:30" },
        [],
        validationOptions,
      ),
    ).toContain("outside_workday");
  });

  it("enforces minimum and maximum duration", () => {
    expect(
      validateBookingDraft(
        { ...draft, start: "10:00", end: "10:29" },
        [],
        validationOptions,
      ),
    ).toContain("duration_too_short");
    expect(
      validateBookingDraft(
        { ...draft, start: "10:00", end: "12:01" },
        [],
        validationOptions,
      ),
    ).toContain("duration_too_long");
  });

  it("rejects past dates and past start times for today", () => {
    expect(
      validateBookingDraft(
        { ...draft, date: "2026-10-24" },
        [],
        validationOptions,
      ),
    ).toContain("date_in_past");
    expect(
      validateBookingDraft(
        {
          ...draft,
          date: validationOptions.today,
          start: "09:00",
          end: "10:00",
        },
        [],
        validationOptions,
      ),
    ).toContain("time_in_past");
  });

  it("detects overlap only for the selected date", () => {
    const overlappingDraft = { ...draft, start: "11:30", end: "12:30" };

    expect(
      validateBookingDraft(
        overlappingDraft,
        [existingBooking],
        validationOptions,
      ),
    ).toContain("overlap");
    expect(
      validateBookingDraft(
        { ...overlappingDraft, date: "2026-10-27" },
        [existingBooking],
        validationOptions,
      ),
    ).not.toContain("overlap");
  });

  it("ignores the edited booking when checking overlap", () => {
    const editedDraft = {
      ...draft,
      start: existingBooking.start,
      end: existingBooking.end,
    };

    expect(
      validateBookingDraft(editedDraft, [existingBooking], {
        ...validationOptions,
        bookingIdToIgnore: existingBooking.id,
      }),
    ).toEqual([]);
  });
});
