import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response';

/**
 * Cliente HTTP que habla con la API Yarqua y desempaqueta el sobre
 * `{ success, message, data }`.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  constructor(private readonly http: HttpClient) {}

  /**
   * Realiza un GET tipado y devuelve solo el payload `data`.
   * @param path Ruta relativa (p. ej. `/stations`).
   * @param options Parámetros y cabeceras opcionales.
   */
  get<T>(
    path: string,
    options?: { params?: Record<string, string | number | boolean>; token?: string | null }
  ): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(this.url(path), {
        headers: this.headers(options?.token),
        params: this.toParams(options?.params),
      })
      .pipe(
        map((res) => this.unwrap(res)),
        catchError((err) => this.handleError(err))
      );
  }

  /**
   * Realiza un POST tipado y devuelve solo el payload `data`.
   * @param path Ruta relativa.
   * @param body Cuerpo JSON.
   * @param token Access token opcional.
   */
  post<T>(path: string, body: unknown, token?: string | null): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(this.url(path), body, {
        headers: this.headers(token),
      })
      .pipe(
        map((res) => this.unwrap(res)),
        catchError((err) => this.handleError(err))
      );
  }

  private url(path: string): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalized}`;
  }

  private headers(token?: string | null): HttpHeaders {
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private toParams(
    params?: Record<string, string | number | boolean>
  ): HttpParams | undefined {
    if (!params) {
      return undefined;
    }
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }

  private unwrap<T>(res: ApiResponse<T>): T {
    if (!res.success) {
      throw new Error(res.message || 'Error en la API');
    }
    if (res.data === null || res.data === undefined) {
      throw new Error(res.message || 'Respuesta vacía de la API');
    }
    return res.data;
  }

  private handleError(err: unknown): Observable<never> {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as ApiResponse<unknown> | string | null;
      if (body && typeof body === 'object' && 'message' in body) {
        return throwError(() => new Error(body.message || err.message));
      }
      return throwError(
        () => new Error(err.message || `Error HTTP ${err.status}`)
      );
    }
    if (err instanceof Error) {
      return throwError(() => err);
    }
    return throwError(() => new Error('Error de red desconocido'));
  }
}
