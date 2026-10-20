// Typed errors every service throws. The tRPC layer maps `code` onto an HTTP
// status (apps/web/src/server/trpc/init.ts), so a service never needs to know
// about tRPC.

export type ServiceErrorCode =
  | "CONFLICT"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION";

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;

  constructor(code: ServiceErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ServiceError";
    this.code = code;
  }
}

export class NotFoundError extends ServiceError {
  constructor(entity: string, id: string) {
    super("NOT_FOUND", `${entity} ${id} does not exist.`);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string) {
    super("VALIDATION", message);
    this.name = "ValidationError";
  }
}

export class ConflictError extends ServiceError {
  constructor(message: string, options?: ErrorOptions) {
    super("CONFLICT", message, options);
    this.name = "ConflictError";
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message = "You are not allowed to do that.") {
    super("FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}
