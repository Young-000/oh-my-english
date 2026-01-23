/**
 * Error Handler
 *
 * 에러 타입별 사용자 친화적 메시지 변환 및 로깅 기능 제공
 */

import {
  TranslationError,
  ValidationError,
  APIError,
  RateLimitError,
  NetworkError,
  ParseError,
  isTranslationError,
  isValidationError,
  isAPIError,
  isRateLimitError,
  isNetworkError,
  isParseError,
  wrapError,
} from '@/domain/errors/translation-errors';

/**
 * 사용자 친화적 에러 메시지 (한국어)
 */
interface UserFriendlyError {
  title: string;
  message: string;
  suggestion?: string;
  retryable: boolean;
  retryAfterSeconds?: number;
}

/**
 * 로그 레벨 정의
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * 로그 항목 인터페이스
 */
interface LogEntry {
  level: LogLevel;
  timestamp: string;
  errorCode: string;
  errorName: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

/**
 * 에러를 사용자 친화적인 한국어 메시지로 변환
 */
export function getUserFriendlyMessage(error: unknown): UserFriendlyError {
  const translationError = isTranslationError(error) ? error : wrapError(error);

  if (isValidationError(translationError)) {
    return handleValidationError(translationError);
  }

  if (isAPIError(translationError)) {
    return handleAPIError(translationError);
  }

  if (isRateLimitError(translationError)) {
    return handleRateLimitError(translationError);
  }

  if (isNetworkError(translationError)) {
    return handleNetworkError(translationError);
  }

  if (isParseError(translationError)) {
    return handleParseError(translationError);
  }

  // 기본 TranslationError 또는 알 수 없는 에러
  return {
    title: '오류가 발생했습니다',
    message: '번역 중 예기치 않은 오류가 발생했습니다.',
    suggestion: '잠시 후 다시 시도해 주세요.',
    retryable: translationError.isRetryable,
  };
}

function handleValidationError(error: ValidationError): UserFriendlyError {
  const fieldMessages: Record<string, { title: string; message: string; suggestion?: string }> = {
    koreanInput: {
      title: '입력 오류',
      message: error.message.includes('required')
        ? '번역할 한국어 문장을 입력해 주세요.'
        : error.message.includes('exceeds')
          ? '입력 가능한 최대 글자수를 초과했습니다.'
          : '입력값이 올바르지 않습니다.',
      suggestion: error.message.includes('exceeds')
        ? '500자 이내로 줄여서 입력해 주세요.'
        : '한글로 된 문장이나 표현을 입력해 주세요.',
    },
    target: {
      title: '설정 오류',
      message: '대화 상대 설정이 올바르지 않습니다.',
      suggestion: '대화 상대를 다시 선택해 주세요.',
    },
    situation: {
      title: '설정 오류',
      message: '상황 설정이 올바르지 않습니다.',
      suggestion: '상황(캐주얼/격식)을 다시 선택해 주세요.',
    },
  };

  const fieldError = fieldMessages[error.field] || {
    title: '입력 오류',
    message: '입력값을 확인해 주세요.',
    suggestion: '올바른 형식으로 다시 입력해 주세요.',
  };

  return {
    ...fieldError,
    retryable: false,
  };
}

function handleAPIError(error: APIError): UserFriendlyError {
  switch (error.statusCode) {
    case 401:
      return {
        title: '인증 오류',
        message: 'AI 서비스 인증에 실패했습니다.',
        suggestion: '관리자에게 문의해 주세요.',
        retryable: false,
      };
    case 400:
      return {
        title: '요청 오류',
        message: '잘못된 요청입니다.',
        suggestion: '입력 내용을 확인하고 다시 시도해 주세요.',
        retryable: false,
      };
    case 502:
    case 503:
    case 504:
      return {
        title: '서비스 일시 중단',
        message: 'AI 서비스가 일시적으로 사용할 수 없습니다.',
        suggestion: '잠시 후 다시 시도해 주세요.',
        retryable: true,
      };
    default:
      return {
        title: 'AI 서비스 오류',
        message: '번역 서비스에 문제가 발생했습니다.',
        suggestion: '잠시 후 다시 시도해 주세요.',
        retryable: error.isRetryable,
      };
  }
}

function handleRateLimitError(error: RateLimitError): UserFriendlyError {
  const retrySeconds = error.getRetryAfterSeconds();

  return {
    title: '요청 제한',
    message: '너무 많은 요청을 보내셨습니다.',
    suggestion: retrySeconds > 60
      ? `${Math.ceil(retrySeconds / 60)}분 후에 다시 시도해 주세요.`
      : `${retrySeconds}초 후에 다시 시도해 주세요.`,
    retryable: true,
    retryAfterSeconds: retrySeconds,
  };
}

function handleNetworkError(error: NetworkError): UserFriendlyError {
  if (error.timeoutMs) {
    return {
      title: '연결 시간 초과',
      message: '서버 응답이 너무 오래 걸립니다.',
      suggestion: '인터넷 연결을 확인하고 다시 시도해 주세요.',
      retryable: true,
    };
  }

  return {
    title: '네트워크 오류',
    message: '서버에 연결할 수 없습니다.',
    suggestion: '인터넷 연결 상태를 확인해 주세요.',
    retryable: true,
  };
}

function handleParseError(_error: ParseError): UserFriendlyError {
  return {
    title: '응답 처리 오류',
    message: 'AI 응답을 처리하는 중 오류가 발생했습니다.',
    suggestion: '다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요.',
    retryable: false,
  };
}

/**
 * 에러 로깅 함수
 */
export function logError(
  error: unknown,
  context?: Record<string, unknown>
): LogEntry {
  const translationError = isTranslationError(error) ? error : wrapError(error);
  const level = getLogLevel(translationError);

  const logEntry: LogEntry = {
    level,
    timestamp: new Date().toISOString(),
    errorCode: translationError.code,
    errorName: translationError.name,
    message: translationError.message,
    stack: translationError.stack,
    context,
  };

  // 콘솔 로깅 (프로덕션에서는 외부 로깅 서비스로 전송 가능)
  const logFn = getLogFunction(level);
  logFn(`[${logEntry.errorCode}] ${logEntry.errorName}: ${logEntry.message}`, {
    ...logEntry,
    error: translationError,
  });

  return logEntry;
}

function getLogLevel(error: TranslationError): LogLevel {
  if (isValidationError(error)) {
    return 'info'; // 사용자 입력 오류는 info 레벨
  }

  if (isRateLimitError(error)) {
    return 'warn'; // Rate limit은 경고 레벨
  }

  if (isNetworkError(error)) {
    return 'warn'; // 네트워크 오류는 경고 레벨
  }

  if (error.statusCode >= 500) {
    return 'error'; // 서버 오류는 에러 레벨
  }

  return 'warn';
}

function getLogFunction(level: LogLevel): (...args: unknown[]) => void {
  switch (level) {
    case 'debug':
      return console.debug;
    case 'info':
      return console.info;
    case 'warn':
      return console.warn;
    case 'error':
      return console.error;
    default:
      return console.log;
  }
}

/**
 * HTTP 응답용 에러 포맷터
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    userMessage: UserFriendlyError;
    retryable: boolean;
    retryAfterSeconds?: number;
  };
}

export function formatErrorResponse(error: unknown): {
  response: ErrorResponse;
  statusCode: number;
} {
  const translationError = isTranslationError(error) ? error : wrapError(error);
  const userMessage = getUserFriendlyMessage(translationError);

  const response: ErrorResponse = {
    error: {
      code: translationError.code,
      message: translationError.message,
      userMessage,
      retryable: translationError.isRetryable,
      ...(isRateLimitError(translationError) && {
        retryAfterSeconds: translationError.getRetryAfterSeconds(),
      }),
    },
  };

  return {
    response,
    statusCode: translationError.statusCode,
  };
}

/**
 * 스트리밍 응답용 에러 포맷터
 */
export function formatStreamError(error: unknown): {
  type: 'error';
  error: ErrorResponse['error'];
} {
  const { response } = formatErrorResponse(error);

  return {
    type: 'error',
    error: response.error,
  };
}

/**
 * Anthropic API 에러를 TranslationError로 변환
 */
export function handleAnthropicError(error: unknown): TranslationError {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Rate limit 에러 감지
    if (message.includes('rate') && message.includes('limit')) {
      return new RateLimitError(60, 60000); // 기본값: 분당 60회
    }

    // 인증 에러 감지
    if (message.includes('auth') || message.includes('api key') || message.includes('401')) {
      return APIError.authenticationFailed();
    }

    // 서버 에러 감지
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return APIError.serverError(error);
    }

    // 네트워크 에러 감지
    if (message.includes('econnrefused') || message.includes('enotfound')) {
      return NetworkError.connectionFailed(error);
    }

    // 타임아웃 에러 감지
    if (message.includes('timeout') || message.includes('etimedout')) {
      return NetworkError.timeout(30000);
    }
  }

  // 기본 API 에러로 변환
  return new APIError(
    error instanceof Error ? error.message : 'Unknown API error',
    'claude',
    500,
    error instanceof Error ? error : undefined
  );
}
