const pendingReads = new Map<string, Promise<unknown>>();

/** Ejecuta una petición real y transforma respuestas fallidas en mensajes para la pantalla. */
async function performRequest<T>(path: string, options: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...options, signal: options.signal ?? AbortSignal.timeout(8000) });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new Error('No se pudo conectar con la API. Verificá que la API esté iniciada.');
  }
  if (response.status === 204) return undefined as T;
  const data: unknown = await response.json().catch(emptyResponse);
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
      ? data.message : 'No se pudo acceder a los datos. Verificá que la API esté iniciada.';
    throw new Error(message);
  }
  if (data === null) throw new Error('La API devolvió una respuesta inválida.');
  return data as T;
}

/** Permite cancelar a un consumidor sin abortar una lectura compartida por otra pantalla montada. */
function followWithSignal<T>(operation: Promise<T>, signal?: AbortSignal | null): Promise<T> {
  if (!signal) return operation;
  if (signal.aborted) return Promise.reject(signal.reason ?? new DOMException('La petición fue cancelada.', 'AbortError'));
  return new Promise<T>((resolve, reject) => {
    const abort = () => reject(signal.reason ?? new DOMException('La petición fue cancelada.', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });
    operation.then(
      (value) => { signal.removeEventListener('abort', abort); resolve(value); },
      (error: unknown) => { signal.removeEventListener('abort', abort); reject(error); },
    );
  });
}

/** Envía peticiones; comparte lecturas GET simultáneas para soportar el montaje doble de Strict Mode. */
export function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  if (method !== 'GET') return performRequest<T>(path, options);
  let operation = pendingReads.get(path) as Promise<T> | undefined;
  if (!operation) {
    operation = performRequest<T>(path, { ...options, signal: undefined });
    pendingReads.set(path, operation);
    void operation.finally(() => { if (pendingReads.get(path) === operation) pendingReads.delete(path); }).catch(() => undefined);
  }
  return followWithSignal(operation, options.signal);
}

/** Mantiene controlado el error cuando el proxy responde sin contenido JSON. */
function emptyResponse(): null { return null; }

