import { config } from 'dotenv';
config();

import '@/ai/flows/egg-production-forecast.ts';
import '@/ai/flows/feed-forecast.ts';
import '@/ai/flows/broken-rate-prediction.ts';
import '@/ai/flows/health-anomaly-detection.ts';
