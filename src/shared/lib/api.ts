export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const NETWORK_ERROR = "We couldn't reach the server. Please check your connection.";
const GENERIC_ERROR = "Something went wrong on our end. Please try again in a moment.";

export async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError(NETWORK_ERROR, 0);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new ApiError(GENERIC_ERROR, res.status);
    throw new ApiError("We couldn't read the response. Please try again.", res.status);
  }

  if (!res.ok) {
    const message =
      typeof data === "object" && data !== null && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : GENERIC_ERROR;
    throw new ApiError(message, res.status);
  }

  return data as T;
}
