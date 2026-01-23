/**
 * Translation Error Classes
 *
 * 번역 서비스에서 발생할 수 있는 에러 타입 정의
 */

/**
 * 번역 관련 에러의 기본 클래스
 */
export class TranslationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isRetryable: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'TranslationError';
    this.code = code;
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
    this.timestamp = new Date();

    // Error 클래스 상속 시 prototype chain 유지
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isRetryable: this.isRetryable,
      timestamp: this.timestamp.toISOString(),
    };
  }
}

/**
 * 입력 검증 실패 에러
 * - 빈 입력
 * - 너무 긴 입력
 * - 잘못된 형식
 */
export class ValidationError extends TranslationError {
  public readonly field: string;
  public readonly value: unknown;

  constructor(
    message: string,
    field: string,
    value?: unknown
  ) {
    super(message, 'VALIDATION_ERROR', 400, false);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }

  static emptyInput(): ValidationError {
    return new ValidationError(
      'Korean input is required',
      'koreanInput',
      ''
    );
  }

  static tooLong(maxLength: number, actualLength: number): ValidationError {
    return new ValidationError(
      `Input exceeds maximum length of ${maxLength} characters`,
      'koreanInput',
      { maxLength, actualLength }
    );
  }

  static invalidType(field: string, expectedType: string, actualType: string): ValidationError {
    return new ValidationError(
      `Field '${field}' must be of type '${expectedType}', got '${actualType}'`,
      field,
      { expectedType, actualType }
    );
  }

  static invalidFormat(field: string, format: string): ValidationError {
    return new ValidationError(
      `Field '${field}' has invalid format. Expected: ${format}`,
      field
    );
  }
}

/**
 * Claude API 호출 에러
 * - 인증 실패
 * - 잘못된 요청
 * - 서버 오류
 */
export class APIError extends TranslationError {
  public readonly provider: string;
  public readonly originalError?: Error;

  constructor(
    message: string,
    provider: string = 'claude',
    statusCode: number = 500,
    originalError?: Error
  ) {
    super(message, 'API_ERROR', statusCode, statusCode >= 500);
    this.name = 'APIError';
    this.provider = provider;
    this.originalError = originalError;
  }

  static authenticationFailed(): APIError {
    return new APIError(
      'API authentication failed. Please check your API key.',
      'claude',
      401
    );
  }

  static invalidRequest(details?: string): APIError {
    return new APIError(
      `Invalid API request${details ? `: ${details}` : ''}`,
      'claude',
      400
    );
  }

  static serverError(originalError?: Error): APIError {
    return new APIError(
      'External API server error',
      'claude',
      502,
      originalError
    );
  }

  static unavailable(): APIError {
    return new APIError(
      'API service is temporarily unavailable',
      'claude',
      503
    );
  }
}

/**
 * Rate Limit 초과 에러
 */
export class RateLimitError extends TranslationError {
  public readonly limit: number;
  public readonly windowMs: number;
  public readonly retryAfterMs: number;

  constructor(
    limit: number,
    windowMs: number,
    retryAfterMs: number = windowMs
  ) {
    super(
      `Rate limit exceeded. Maximum ${limit} requests per ${windowMs / 1000} seconds.`,
      'RATE_LIMIT_EXCEEDED',
      429,
      true
    );
    this.name = 'RateLimitError';
    this.limit = limit;
    this.windowMs = windowMs;
    this.retryAfterMs = retryAfterMs;
  }

  getRetryAfterSeconds(): number {
    return Math.ceil(this.retryAfterMs / 1000);
  }
}

/**
 * 네트워크 연결 에러
 * - 타임아웃
 * - DNS 실패
 * - 연결 거부
 */
export class NetworkError extends TranslationError {
  public readonly originalError?: Error;
  public readonly timeoutMs?: number;

  constructor(
    message: string,
    originalError?: Error,
    timeoutMs?: number
  ) {
    super(message, 'NETWORK_ERROR', 503, true);
    this.name = 'NetworkError';
    this.originalError = originalError;
    this.timeoutMs = timeoutMs;
  }

  static timeout(timeoutMs: number): NetworkError {
    return new NetworkError(
      `Request timed out after ${timeoutMs}ms`,
      undefined,
      timeoutMs
    );
  }

  static connectionFailed(originalError?: Error): NetworkError {
    return new NetworkError(
      'Failed to connect to the server',
      originalError
    );
  }

  static dnsResolutionFailed(host: string): NetworkError {
    return new NetworkError(
      `Failed to resolve DNS for host: ${host}`
    );
  }
}

/**
 * 응답 파싱 에러
 * - JSON 파싱 실패
 * - 필수 필드 누락
 * - 잘못된 응답 형식
 */
export class ParseError extends TranslationError {
  public readonly responseText?: string;
  public readonly missingFields?: string[];

  constructor(
    message: string,
    responseText?: string,
    missingFields?: string[]
  ) {
    super(message, 'PARSE_ERROR', 500, false);
    this.name = 'ParseError';
    this.responseText = responseText?.substring(0, 500); // 너무 긴 텍스트 방지
    this.missingFields = missingFields;
  }

  static jsonParseFailed(rawText: string, parseError?: Error): ParseError {
    return new ParseError(
      `Failed to parse JSON response: ${parseError?.message || 'Invalid JSON'}`,
      rawText
    );
  }

  static missingRequiredFields(fields: string[]): ParseError {
    return new ParseError(
      `Response missing required fields: ${fields.join(', ')}`,
      undefined,
      fields
    );
  }

  static unexpectedResponseType(expected: string, received: string): ParseError {
    return new ParseError(
      `Unexpected response type. Expected '${expected}', got '${received}'`
    );
  }

  static invalidResponseStructure(details: string): ParseError {
    return new ParseError(
      `Invalid response structure: ${details}`
    );
  }
}

/**
 * 에러 타입 가드 함수들
 */
export function isTranslationError(error: unknown): error is TranslationError {
  return error instanceof TranslationError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

export function isParseError(error: unknown): error is ParseError {
  return error instanceof ParseError;
}

/**
 * 일반 Error를 TranslationError로 래핑
 */
export function wrapError(error: unknown): TranslationError {
  if (isTranslationError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // 네트워크 관련 에러 감지
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return NetworkError.connectionFailed(error);
    }

    // 타임아웃 에러 감지
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      return NetworkError.timeout(30000);
    }

    // JSON 파싱 에러 감지
    if (error.message.includes('JSON') || error.name === 'SyntaxError') {
      return ParseError.jsonParseFailed('', error);
    }

    return new TranslationError(
      error.message,
      'UNKNOWN_ERROR',
      500,
      false
    );
  }

  return new TranslationError(
    'An unknown error occurred',
    'UNKNOWN_ERROR',
    500,
    false
  );
}
