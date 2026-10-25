import type {
  BookingDraft,
  BookingValidationOptions,
} from "../model/booking";
import type { BookingServiceError } from "./booking-service";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function readRequestBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function parseBookingDraft(value: unknown): BookingDraft | null {
  if (
    !isRecord(value) ||
    typeof value.date !== "string" ||
    typeof value.start !== "string" ||
    typeof value.end !== "string" ||
    (value.title !== undefined && typeof value.title !== "string")
  ) {
    return null;
  }

  return {
    date: value.date,
    start: value.start,
    end: value.end,
    ...(value.title === undefined ? {} : { title: value.title }),
  };
}

export function parseBookingPatch(
  value: unknown,
): Partial<BookingDraft> | null {
  if (!isRecord(value)) {
    return null;
  }

  const patch: Partial<BookingDraft> = {};

  for (const key of ["date", "start", "end", "title"] as const) {
    if (value[key] === undefined) {
      continue;
    }

    if (typeof value[key] !== "string") {
      return null;
    }

    patch[key] = value[key];
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

export function getBookingValidationOptions(
  now = new Date(),
): BookingValidationOptions {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return {
    today: `${year}-${month}-${day}`,
    currentMinutes: now.getHours() * 60 + now.getMinutes(),
  };
}

export function bookingServiceErrorResponse(
  error: BookingServiceError,
): Response {
  if (error.code === "not_found") {
    return Response.json(
      { error: { code: error.code, message: "Booking not found." } },
      { status: 404 },
    );
  }

  const isConflict = error.code === "conflict";

  return Response.json(
    {
      error: {
        code: error.code,
        message: isConflict
          ? "This time overlaps an existing booking."
          : "Booking data violates business rules.",
        issues: error.issues,
      },
    },
    { status: isConflict ? 409 : 422 },
  );
}

export function invalidRequestResponse(): Response {
  return Response.json(
    {
      error: {
        code: "invalid_request",
        message: "Request body has an invalid format.",
      },
    },
    { status: 400 },
  );
}
