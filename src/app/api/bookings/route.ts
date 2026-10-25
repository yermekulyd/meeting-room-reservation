import { isBookingDate } from "@/features/booking";
import {
  bookingService,
  bookingServiceErrorResponse,
  getBookingValidationOptions,
  invalidRequestResponse,
  parseBookingDraft,
  readRequestBody,
} from "@/features/booking/api";

export function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");

  if (!date || !isBookingDate(date)) {
    return Response.json(
      {
        error: {
          code: "invalid_date",
          message: "Query parameter 'date' must use YYYY-MM-DD format.",
        },
      },
      { status: 400 },
    );
  }

  return Response.json(bookingService.list(date));
}

export async function POST(request: Request) {
  const draft = parseBookingDraft(await readRequestBody(request));

  if (!draft) {
    return invalidRequestResponse();
  }

  const result = bookingService.create(
    draft,
    getBookingValidationOptions(),
  );

  if (!result.ok) {
    return bookingServiceErrorResponse(result.error);
  }

  return Response.json(result.booking, { status: 201 });
}
