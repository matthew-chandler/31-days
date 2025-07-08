export interface URLMapping {
  short_path: string;
  long_url: string;
}

export interface CreateURLRequest {
  long_url: string;
  short_path: string;
}

export interface CreateURLResponse {
  message: string;
  short_url: string;
  long_url: string;
}

export interface ErrorResponse {
  detail: string;
}

export interface URLListResponse {
  total_urls: number;
  mappings: { [key: string]: string };
}
