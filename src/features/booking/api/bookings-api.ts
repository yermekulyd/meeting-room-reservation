import type {
  Booking,
  BookingDraft,
  BookingValidationError,
} from "../model/booking";

type ApiErrorDetails = {
  code?: string;
  message?: string;
  issues?: BookingValidationError[];
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly issues: readonly BookingValidationError[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function readErrorDetails(value: unknown): ApiErrorDetails {
  if (
    typeof value !== "object" ||
    value === null ||
    !("error" in value) ||
    typeof value.error !== "object" ||
    value.error === null
  ) {
    return {};
  }

  const error = value.error as Record<string, unknown>;

  return {
    code: typeof error.code === "string" ? error.code : undefined,
    message: typeof error.message === "string" ? error.message : undefined,
    issues: Array.isArray(error.issues)
      ? (error.issues.filter(
          (issue): issue is BookingValidationError => typeof issue === "string",
        ) as BookingValidationError[])
      : undefined,
  };
}

async function request<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      "network_error",
      "Не удалось связаться с сервером.",
    );
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const details = readErrorDetails(body);

    throw new ApiError(
      response.status,
      details.code ?? "request_failed",
      details.message ?? "Не удалось выполнить запрос.",
      details.issues,
    );
  }

  return body as T;
}

export const bookingsApi = {
  list(date: string): Promise<Booking[]> {
    return request(`/api/bookings?date=${encodeURIComponent(date)}`);
  },

  create(draft: BookingDraft): Promise<Booking> {
    return request("/api/bookings", {
      method: "POST",
      body: JSON.stringify(draft),
    });
  },
};
