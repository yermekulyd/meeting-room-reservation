import { describe, expect, it } from "vitest";

import { DELETE, PATCH } from "./[id]/route";
import { GET, POST } from "./route";

const date = "2099-01-15";

function jsonRequest(
  url: string,
  method: "POST" | "PATCH",
  body: unknown,
) {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("bookings API", () => {
  it("supports CRUD and returns 409 for an overlap", async () => {
    const createResponse = await POST(
      jsonRequest("http://localhost/api/bookings", "POST", {
        date,
        start: "10:00",
        end: "11:00",
        title: "Planning",
      }),
    );
    const createdBooking = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createdBooking).toMatchObject({
      date,
      start: "10:00",
      end: "11:00",
      title: "Planning",
    });

    const listResponse = GET(
      new Request(`http://localhost/api/bookings?date=${date}`),
    );
    expect(await listResponse.json()).toEqual([createdBooking]);

    const conflictResponse = await POST(
      jsonRequest("http://localhost/api/bookings", "POST", {
        date,
        start: "10:30",
        end: "11:30",
      }),
    );
    expect(conflictResponse.status).toBe(409);
    expect(await conflictResponse.json()).toMatchObject({
      error: { code: "conflict", issues: ["overlap"] },
    });

    const context = { params: Promise.resolve({ id: createdBooking.id }) };
    const updateResponse = await PATCH(
      jsonRequest("http://localhost/api/bookings", "PATCH", {
        title: "Updated planning",
      }),
      context,
    );
    expect(updateResponse.status).toBe(200);
    expect(await updateResponse.json()).toMatchObject({
      id: createdBooking.id,
      title: "Updated planning",
    });

    const deleteResponse = await DELETE(
      new Request("http://localhost/api/bookings", { method: "DELETE" }),
      context,
    );
    expect(deleteResponse.status).toBe(204);
  });
});
