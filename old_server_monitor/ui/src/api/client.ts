const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${path}`;
  const isFormData = options?.body instanceof FormData;
  const hasExplicitContentType = Boolean((options?.headers as Record<string, string> | undefined)?.['Content-Type']);

  const mergedHeaders: HeadersInit = isFormData
    ? { ...(options?.headers ?? {}) }
    : {
      ...(hasExplicitContentType ? {} : { 'Content-Type': 'application/json' }),
      ...(options?.headers ?? {}),
    };

  let response: Response;
  try {
    response = await fetch(url, {
      headers: mergedHeaders,
      ...options,
    });
  } catch (networkError) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Unable to reach the server. Check your connection.',
      },
    };
  }

  if (!response.ok) {
    let errorBody: {
      code?: string;
      message?: string;
      detail?: unknown;
      error?: { code?: string; message?: string };
    } = {};
    try {
      errorBody = await response.json();
    } catch {
      // ignore parse failures
    }

    const detailText = Array.isArray(errorBody.detail)
      ? errorBody.detail
          .map((item) => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item !== null && 'msg' in item && typeof item.msg === 'string') {
              return item.msg;
            }
            return JSON.stringify(item);
          })
          .join('; ')
      : typeof errorBody.detail === 'string'
        ? errorBody.detail
        : typeof errorBody.message === 'string'
          ? errorBody.message
          : typeof errorBody.error?.message === 'string'
            ? errorBody.error.message
            : `Request failed with status ${response.status}.`;

    return {
      success: false,
      error: {
        code: errorBody.code ?? errorBody.error?.code ?? `HTTP_${response.status}`,
        message: detailText,
      },
    };
  }

  if (response.status === 204) {
    return { success: true, data: undefined as unknown as T };
  }

  const json = await response.json();

  // If the backend already wraps in { success, data } pass through, otherwise wrap.
  if (typeof json === 'object' && json !== null && 'success' in json) {
    return json as ApiResponse<T>;
  }
  return { success: true, data: json as T };
}

export const api = {
  get<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return request<T>(path, { method: 'GET', ...options });
  },
  post<T>(path: string, body: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    });
  },
  postForm<T>(path: string, body: FormData, options?: RequestInit): Promise<ApiResponse<T>> {
    return request<T>(path, {
      method: 'POST',
      body,
      ...options,
    });
  },
  put<T>(path: string, body: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    });
  },
  patch<T>(path: string, body: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    });
  },
  delete<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return request<T>(path, { method: 'DELETE', ...options });
  },
};
