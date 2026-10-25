import { describe, expect, it } from "vitest";

import {
  type Booking,
  type BookingDraft,
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

describe("validateBookingDraft", () => {
  it("accepts a valid booking and allows touching boundaries", () => {
    expect(validateBookingDraft(draft, [existingBooking])).toEqual([]);
  });

  it("rejects malformed time values", () => {
    expect(
      validateBookingDraft({ ...draft, start: "9:00" }, []),
    ).toEqual(["invalid_time"]);
  });

  it("requires the start to be earlier than the end", () => {
    expect(
      validateBookingDraft({ ...draft, start: "11:00", end: "11:00" }, []),
    ).toEqual(["invalid_interval"]);
  });

  it("keeps bookings within the working day", () => {
    expect(
      validateBookingDraft({ ...draft, start: "08:30", end: "09:30" }, []),
    ).toContain("outside_workday");
    expect(
      validateBookingDraft({ ...draft, start: "17:30", end: "18:30" }, []),
    ).toContain("outside_workday");
  });

  it("enforces minimum and maximum duration", () => {
    expect(
      validateBookingDraft({ ...draft, start: "10:00", end: "10:29" }, []),
    ).toContain("duration_too_short");
    expect(
      validateBookingDraft({ ...draft, start: "10:00", end: "12:01" }, []),
    ).toContain("duration_too_long");
  });

  it("detects overlap only for the selected date", () => {
    const overlappingDraft = { ...draft, start: "11:30", end: "12:30" };

    expect(validateBookingDraft(overlappingDraft, [existingBooking])).toContain(
      "overlap",
    );
    expect(
      validateBookingDraft(
        { ...overlappingDraft, date: "2026-10-27" },
        [existingBooking],
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
      validateBookingDraft(editedDraft, [existingBooking], existingBooking.id),
    ).toEqual([]);
  });
});
