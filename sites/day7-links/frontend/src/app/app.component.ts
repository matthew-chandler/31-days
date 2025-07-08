import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';

interface CreateURLRequest {
  long_url: string;
  short_path: string;
}

interface CreateURLResponse {
  message: string;
  short_url: string;
  long_url: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Link Shortener';
  longUrl = '';
  shortPath = '';
  successMessage = '';
  errorMessage = '';
  isLoading = false;
  private apiUrl = environment.apiUrl;
  public serviceDomain = environment.serviceDomain;

  constructor(private http: HttpClient) {}

  async createShortURL() {
    if (!this.longUrl || !this.shortPath) {
      this.showError('Please fill in both fields');
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    // Ensure URL has a protocol
    let formattedUrl = this.longUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const request: CreateURLRequest = {
      long_url: formattedUrl,
      short_path: this.shortPath.trim()
    };

    console.log('Sending request:', request); // Debug log

    try {
      const response = await firstValueFrom(
        this.http.post<CreateURLResponse>(`${this.apiUrl}/shorten`, request)
      );
      
      this.showSuccess(`Short URL created: ${response.short_url}`);
      this.longUrl = '';
      this.shortPath = '';
    } catch (error) {
      console.error('Error creating short URL:', error); // Debug log
      this.handleError(error);
    } finally {
      this.isLoading = false;
    }
  }

  private showSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 5000);
  }

  private showError(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
  }

  private clearMessages() {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private handleError(error: any) {
    console.error('Error occurred:', error); // Debug logging
    this.showError(this.getErrorMessage(error));
  }

  private getErrorMessage(error: any): string {
    console.log('Error object:', error); // Debug logging
    
    if (error instanceof HttpErrorResponse) {
      // Handle HTTP errors
      if (error.error && typeof error.error === 'object') {
        if (error.error.detail) {
          // Handle FastAPI validation errors (422)
          if (Array.isArray(error.error.detail)) {
            const validationErrors = error.error.detail.map((err: any) => 
              `${err.loc?.join('.')}: ${err.msg}`
            ).join(', ');
            return `Validation error: ${validationErrors}`;
          }
          return error.error.detail;
        }
        // If error.error is an object but no detail, stringify it
        return JSON.stringify(error.error);
      }
      if (typeof error.error === 'string') {
        return error.error;
      }
      return `HTTP ${error.status}: ${error.statusText || 'Unknown error'}`;
    }
    
    // Handle other types of errors
    if (error && typeof error === 'object') {
      if (error.message) {
        return error.message;
      }
      if (error.name) {
        return `${error.name}: ${error.message || 'Unknown error'}`;
      }
      return JSON.stringify(error);
    }
    
    if (typeof error === 'string') {
      return error;
    }
    
    return 'An unknown error occurred';
  }
}
