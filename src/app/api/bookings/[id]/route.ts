import {
  bookingService,
  bookingServiceErrorResponse,
  getBookingValidationOptions,
  invalidRequestResponse,
  parseBookingPatch,
  readRequestBody,
} from "@/features/booking/api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const patch = parseBookingPatch(await readRequestBody(request));

  if (!patch) {
    return invalidRequestResponse();
  }

  const { id } = await params;
  const result = bookingService.update(
    id,
    patch,
    getBookingValidationOptions(),
  );

  if (!result.ok) {
    return bookingServiceErrorResponse(result.error);
  }

  return Response.json(result.booking);
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const result = bookingService.delete(id);

  if (!result.ok) {
    return bookingServiceErrorResponse(result.error);
  }

  return new Response(null, { status: 204 });
}
