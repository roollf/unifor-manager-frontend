/**
 * Production environment configuration.
 * Replace placeholder values per deployment (CI/CD or hosting platform).
 */
export const environment = {
  production: true,
  apiUrl: '/api',
  keycloak: {
    url: 'https://keycloak.example.com',
    realm: 'unifor',
    clientId: 'unifor-manager',
  },
} as const;
