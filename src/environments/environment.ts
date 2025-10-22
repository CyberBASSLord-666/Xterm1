// Default environment configuration (development)
export const environment = {
  production: false,
  defaults: {
    geminiApiKey: '',
    analyticsMeasurementId: '',
  },
  bootstrapConfig: {
    meta: {
      geminiApiKey: 'gemini-api-key',
      analyticsMeasurementId: 'analytics-measurement-id',
    },
    failOnMissingGeminiKey: false,
  },
};
