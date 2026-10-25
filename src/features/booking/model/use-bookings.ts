"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError, bookingsApi } from "../api/bookings-api";
import type { Booking, BookingDraft } from "./booking";

type BookingsState = {
  date: string;
  bookings: Booking[];
  loading: boolean;
  error: ApiError | null;
};

function normalizeApiError(error: unknown): ApiError {
  return error instanceof ApiError
    ? error
    : new ApiError(0, "unknown_error", "Произошла непредвиденная ошибка.");
}

export function useBookings(date: string) {
  const [state, setState] = useState<BookingsState>({
    date,
    bookings: [],
    loading: true,
    error: null,
  });
  const requestId = useRef(0);

  useEffect(() => {
    const currentRequestId = ++requestId.current;
    let active = true;

    void bookingsApi
      .list(date)
      .then((bookings) => {
        if (active && currentRequestId === requestId.current) {
          setState({ date, bookings, loading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (active && currentRequestId === requestId.current) {
          setState({
            date,
            bookings: [],
            loading: false,
            error: normalizeApiError(error),
          });
        }
      });

    return () => {
      active = false;
      requestId.current += 1;
    };
  }, [date]);

  const reload = useCallback(async () => {
    const currentRequestId = ++requestId.current;

    setState((current) => ({
      date,
      bookings: current.date === date ? current.bookings : [],
      loading: true,
      error: null,
    }));

    try {
      const bookings = await bookingsApi.list(date);

      if (currentRequestId === requestId.current) {
        setState({ date, bookings, loading: false, error: null });
      }
    } catch (error) {
      if (currentRequestId === requestId.current) {
        setState((current) => ({
          date,
          bookings: current.date === date ? current.bookings : [],
          loading: false,
          error: normalizeApiError(error),
        }));
      }
    }
  }, [date]);

  const createBooking = useCallback(
    async (draft: BookingDraft) => {
      const booking = await bookingsApi.create(draft);
      await reload();
      return booking;
    },
    [reload],
  );

  const isCurrentDate = state.date === date;

  return {
    bookings: isCurrentDate ? state.bookings : [],
    loading: !isCurrentDate || state.loading,
    error: isCurrentDate ? state.error : null,
    reload,
    createBooking,
  };
}
