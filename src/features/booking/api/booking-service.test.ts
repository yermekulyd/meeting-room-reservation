import { describe, expect, it } from "vitest";

import type { Booking, BookingValidationOptions } from "../model/booking";
import { createBookingService } from "./booking-service";

const existingBooking: Booking = {
  id: "booking-1",
  date: "2026-10-26",
  start: "10:00",
  end: "11:00",
  title: "Daily",
};

const validationOptions: BookingValidationOptions = {
  today: "2026-10-25",
  currentMinutes: 12 * 60,
};

describe("bookingService", () => {
  it("creates and lists bookings in chronological order", () => {
    const service = createBookingService([existingBooking], () => "booking-2");
    const result = service.create(
      {
        date: existingBooking.date,
        start: "09:00",
        end: "10:00",
        title: "Planning",
      },
      validationOptions,
    );

    expect(result).toEqual({
      ok: true,
      booking: {
        id: "booking-2",
        date: existingBooking.date,
        start: "09:00",
        end: "10:00",
        title: "Planning",
      },
    });
    expect(service.list(existingBooking.date).map(({ id }) => id)).toEqual([
      "booking-2",
      "booking-1",
    ]);
  });

  it("returns a conflict without changing stored bookings", () => {
    const service = createBookingService([existingBooking]);
    const result = service.create(
      {
        date: existingBooking.date,
        start: "10:30",
        end: "11:30",
      },
      validationOptions,
    );

    expect(result).toMatchObject({
      ok: false,
      error: { code: "conflict", issues: ["overlap"] },
    });
    expect(service.list(existingBooking.date)).toEqual([existingBooking]);
  });

  it("updates a booking without conflicting with itself", () => {
    const service = createBookingService([existingBooking]);

    expect(
      service.update(
        existingBooking.id,
        { title: "Updated daily" },
        validationOptions,
      ),
    ).toMatchObject({
      ok: true,
      booking: { id: existingBooking.id, title: "Updated daily" },
    });
  });

  it("deletes an existing booking and reports missing bookings", () => {
    const service = createBookingService([existingBooking]);

    expect(service.delete(existingBooking.id)).toEqual({ ok: true });
    expect(service.delete(existingBooking.id)).toEqual({
      ok: false,
      error: { code: "not_found" },
    });
  });
});
