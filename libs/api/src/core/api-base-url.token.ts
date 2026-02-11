import { InjectionToken } from '@angular/core';

/**
 * Base URL for the backend API (e.g. http://localhost:8080).
 * Provided in app.config from environment.apiUrl per ARCHITECTURE §4.1.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
