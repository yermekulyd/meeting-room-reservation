import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, bookingsApi } from "./bookings-api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("bookingsApi", () => {
  it("loads bookings for the encoded date", async () => {
    const booking = {
      id: "booking-1",
      date: "2026-10-26",
      start: "10:00",
      end: "11:00",
    };
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json([booking]),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(bookingsApi.list(booking.date)).resolves.toEqual([booking]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/bookings?date=2026-10-26",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("exposes conflict details without hiding the HTTP status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            error: {
              code: "conflict",
              message: "This time overlaps an existing booking.",
              issues: ["overlap"],
            },
          },
          { status: 409 },
        ),
      ),
    );

    const request = bookingsApi.create({
      date: "2026-10-26",
      start: "10:00",
      end: "11:00",
    });

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({
      status: 409,
      code: "conflict",
      issues: ["overlap"],
    });
  });
});
