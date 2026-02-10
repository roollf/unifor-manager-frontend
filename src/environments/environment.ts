/**
 * Development environment configuration.
 * Per FRONTEND_CONTRACT §4.1: Backend at http://localhost:8080 when running with Docker Compose.
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  keycloak: {
    url: 'http://localhost:8081',
    realm: 'unifor',
    clientId: 'unifor-manager',
  },
} as const;
