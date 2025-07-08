import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateURLRequest, CreateURLResponse, URLListResponse, ErrorResponse } from './models';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LinkService {
  private apiUrl = environment.apiUrl; // Backend API URL from environment

  constructor(private http: HttpClient) {}

  createShortURL(request: CreateURLRequest): Observable<CreateURLResponse> {
    return this.http.post<CreateURLResponse>(`${this.apiUrl}/shorten`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  getAllURLs(): Observable<URLListResponse> {
    return this.http.get<URLListResponse>(`${this.apiUrl}/admin/urls`)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteURL(shortPath: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/urls/${shortPath}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.detail) {
        errorMessage = error.error.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
    }
    
    return throwError(() => errorMessage);
  }
}
