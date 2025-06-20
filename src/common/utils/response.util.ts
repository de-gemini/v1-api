import { SuccessResponse } from '../dto/success-response.dto';

export function success<T>(payload: T, message = 'Success', statusCode = 200): SuccessResponse<T> {
  return {
    statusCode,
    message,
    payload,
  };
} 