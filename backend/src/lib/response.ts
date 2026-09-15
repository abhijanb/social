import type { Response } from "express";

type Meta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type CursorMeta = {
  nextCursor: string | null;
  hasMore: boolean;
};

export function responseSuccess<T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200,
) {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
}

export function responseError(
  res: Response,
  error: unknown,
  message = "Error",
  statusCode = 500,
) {
  return res.status(statusCode).json({
    status: "error",
    message,
    error,
  });
}

export function responseCreated<T>(
  res: Response,
  data: T,
  message = "Resource created successfully",
) {
  return responseSuccess(res, data, message, 201);
}

export function responsePaginated<T>(
  res: Response,
  data: T[],
  meta: Meta,
  message = "Success",
) {
  return responseSuccess(res, { data, meta }, message, 200);
}

export function responseCursor<T>(
  res: Response,
  data: T[],
  meta: CursorMeta,
  message = "Success",
) {
  return responseSuccess(res, { data, meta }, message, 200);
}

export function responseNoContent(res: Response) {
  return res.status(204).end();
}
