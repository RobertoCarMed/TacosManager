type DiagnosticValue = string | number | boolean | null | undefined;

type FirestoreOperationOptions = {
  diagnostics?: Record<string, DiagnosticValue>;
  fallbackMessage?: string;
  timeoutMs?: number;
};

type FirestoreErrorLike = {
  code?: string;
  message?: string;
};

type SnapshotLike = {
  docs?: unknown[];
  metadata?: {
    fromCache?: boolean;
    hasPendingWrites?: boolean;
  };
};

const DEFAULT_TIMEOUT_MS = 15000;
const SLOW_OPERATION_WARN_MS = 5000;

export class FirestoreOperationTimeoutError extends Error {
  code = 'firestore/operation-timeout';

  constructor(operationName: string, timeoutMs: number) {
    super(
      `La operacion ${operationName} tardo mas de ${Math.round(
        timeoutMs / 1000,
      )}s. Verifica tu conexion e intenta de nuevo.`,
    );
    this.name = 'FirestoreOperationTimeoutError';
  }
}

function getFirestoreError(error: unknown): FirestoreErrorLike {
  if (error && typeof error === 'object') {
    return error as FirestoreErrorLike;
  }

  return {};
}

function logDev(
  level: 'log' | 'warn' | 'error',
  message: string,
  details?: Record<string, unknown>,
) {
  if (!__DEV__) {
    return;
  }

  if (details) {
    console[level](message, details);
    return;
  }

  console[level](message);
}

export function toFirestoreUserError(
  error: unknown,
  fallbackMessage = 'No se pudo completar la operacion en Firestore.',
) {
  if (error instanceof FirestoreOperationTimeoutError) {
    return error;
  }

  const firestoreError = getFirestoreError(error);
  const rawMessage = firestoreError.message;
  const code = firestoreError.code;
  let message = rawMessage || fallbackMessage;

  if (code === 'firestore/permission-denied') {
    message = 'No tienes permisos para completar esta operacion.';
  } else if (code === 'firestore/unavailable') {
    message = 'Firestore no esta disponible. Revisa tu conexion e intenta de nuevo.';
  } else if (code === 'firestore/deadline-exceeded') {
    message = 'Firestore no respondio a tiempo. Revisa tu conexion e intenta de nuevo.';
  } else if (
    code === 'firestore/failed-precondition' &&
    rawMessage?.toLowerCase().includes('index')
  ) {
    message =
      'La consulta requiere un indice de Firestore. Despliega firestore.indexes.json.';
  }

  const mappedError = new Error(message || fallbackMessage);
  (mappedError as FirestoreErrorLike).code = code;
  return mappedError;
}

export async function runFirestoreOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  options: FirestoreOperationOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const startedAt = Date.now();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let didTimeout = false;

  const operationPromise = Promise.resolve().then(operation);
  operationPromise.catch(error => {
    if (!didTimeout) {
      return;
    }

    logDev('warn', `[Firestore] ${operationName} late rejection`, {
      ...options.diagnostics,
      code: getFirestoreError(error).code,
      message: getFirestoreError(error).message,
    });
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      didTimeout = true;
      reject(new FirestoreOperationTimeoutError(operationName, timeoutMs));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([operationPromise, timeoutPromise]);
    const durationMs = Date.now() - startedAt;
    logDev(
      durationMs >= SLOW_OPERATION_WARN_MS ? 'warn' : 'log',
      `[Firestore] ${operationName} completed`,
      {
        ...options.diagnostics,
        durationMs,
      },
    );
    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const firestoreError = getFirestoreError(error);
    logDev('error', `[Firestore] ${operationName} failed`, {
      ...options.diagnostics,
      code: firestoreError.code,
      durationMs,
      message: firestoreError.message,
    });
    throw toFirestoreUserError(error, options.fallbackMessage);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export function logFirestoreSubscriptionStart(
  subscriptionName: string,
  diagnostics?: Record<string, DiagnosticValue>,
) {
  const startedAt = Date.now();
  logDev('log', `[Firestore] ${subscriptionName} subscribe`, diagnostics);
  return startedAt;
}

export function logFirestoreSnapshot(
  subscriptionName: string,
  startedAt: number,
  snapshot: SnapshotLike,
) {
  logDev('log', `[Firestore] ${subscriptionName} snapshot`, {
    docs: snapshot.docs?.length,
    durationMs: Date.now() - startedAt,
    fromCache: snapshot.metadata?.fromCache,
    hasPendingWrites: snapshot.metadata?.hasPendingWrites,
  });
}

export function logFirestoreSubscriptionError(
  subscriptionName: string,
  error: unknown,
) {
  const firestoreError = getFirestoreError(error);
  logDev('error', `[Firestore] ${subscriptionName} listener error`, {
    code: firestoreError.code,
    message: firestoreError.message,
  });
}

export function logFirestoreSubscriptionEnd(subscriptionName: string) {
  logDev('log', `[Firestore] ${subscriptionName} unsubscribe`);
}
