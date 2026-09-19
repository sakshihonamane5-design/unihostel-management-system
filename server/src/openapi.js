export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'UniHostel API',
    version: '1.0.0',
    description:
      'REST API for the multi-institution UniHostel hostel management system. Session authentication uses an HTTP-only cookie.',
  },
  servers: [{ url: '/api', description: 'Application API' }],
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'unihostel_token' },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: { 200: { description: 'Service is running' } },
      },
    },
    '/auth/register': { post: { summary: 'Register a student (PENDING)', responses: { 201: { description: 'Submitted' } } } },
    '/auth/login': { post: { summary: 'Sign in and set HTTP-only cookie', responses: { 200: { description: 'Authenticated' } } } },
    '/auth/logout': { post: { summary: 'Clear auth cookie', responses: { 200: { description: 'Signed out' } } } },
    '/auth/me': { get: { summary: 'Current user', security: [{ cookieAuth: [] }], responses: { 200: { description: 'Profile' } } } },
    '/residencies/check-in': { post: { summary: 'Check in and allocate a bed', security: [{ cookieAuth: [] }] } },
    '/residencies/transfer': { post: { summary: 'Transfer to another bed', security: [{ cookieAuth: [] }] } },
    '/residencies/check-out': { post: { summary: 'Checkout and release bed', security: [{ cookieAuth: [] }] } },
    '/mentors/assign': { post: { summary: 'Assign mentor with deterministic load balancing', security: [{ cookieAuth: [] }] } },
    '/leaves': { post: { summary: 'Submit leave request', security: [{ cookieAuth: [] }] } },
    '/gate/verify': { post: { summary: 'Verify QR-ready gate pass code', security: [{ cookieAuth: [] }] } },
    '/gate/movements': { post: { summary: 'Record ENTRY or EXIT', security: [{ cookieAuth: [] }] } },
    '/reports': { get: { summary: 'Operational reports', security: [{ cookieAuth: [] }] } },
  },
};
