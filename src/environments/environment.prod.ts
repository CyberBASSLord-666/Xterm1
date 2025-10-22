// Production environment configuration
export const environment = {
  production: true,
  defaults: {
    geminiApiKey: '',
    analyticsMeasurementId: '',
  },
  bootstrapConfig: {
    meta: {
      geminiApiKey: 'gemini-api-key',
      analyticsMeasurementId: 'analytics-measurement-id',
    },
    failOnMissingGeminiKey: true,
  },
};
