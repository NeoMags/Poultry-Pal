'use server';

import { eggProductionForecast, EggProductionForecastOutput } from '@/ai/flows/egg-production-forecast';
import { feedForecast, FeedForecastOutput } from '@/ai/flows/feed-forecast';
import { brokenRatePrediction, BrokenRatePredictionOutput } from '@/ai/flows/broken-rate-prediction';
import { healthAnomalyDetection, HealthAnomalyOutput } from '@/ai/flows/health-anomaly-detection';

export async function getEggProductionForecast(currentHenCount: number): Promise<EggProductionForecastOutput | { error: string }> {
  try {
    const historicalData = JSON.stringify([
        { day: '2023-10-01', hens: 500, eggs: 450 },
        { day: '2023-10-02', hens: 502, eggs: 455 },
        { day: '2023-10-03', hens: 501, eggs: 448 },
        { day: '2023-10-04', hens: 503, eggs: 460 },
        { day: '2023-10-05', hens: 505, eggs: 465 },
        { day: '2023-10-06', hens: 504, eggs: 462 },
        { day: '2023-10-07', hens: 506, eggs: 470 },
        { day: '2023-10-08', hens: 508, eggs: 475 },
        { day: '2023-10-09', hens: 507, eggs: 472 },
        { day: '2023-10-10', hens: 510, eggs: 480 },
    ]);
    
    // A mock forecast if the AI call is not configured
    // To use the actual AI, ensure your genkit environment is set up.
    if (!process.env.GENKIT_API_KEY && !process.env.GOOGLE_API_KEY) {
        console.warn("Genkit/Google API key not found. Returning mock forecast.");
        const mockForecast = {
            forecast: JSON.stringify([
                { day: 1, predicted_eggs: 482 },
                { day: 2, predicted_eggs: 485 },
                { day: 3, predicted_eggs: 488 },
                { day: 4, predicted_eggs: 490 },
                { day: 5, predicted_eggs: 492 },
                { day: 6, predicted_eggs: 495 },
                { day: 7, predicted_eggs: 498 },
            ]),
            confidenceInterval: JSON.stringify([
                { day: 1, lower_bound: 475, upper_bound: 490 },
                { day: 2, lower_bound: 478, upper_bound: 492 },
                { day: 3, lower_bound: 480, upper_bound: 495 },
                { day: 4, lower_bound: 482, upper_bound: 498 },
                { day: 5, lower_bound: 485, upper_bound: 500 },
                { day: 6, lower_bound: 488, upper_bound: 502 },
                { day: 7, lower_bound: 490, upper_bound: 505 },
            ]),
        };
        await new Promise(resolve => setTimeout(resolve, 1000)); // simulate network delay
        return mockForecast;
    }

    const result = await eggProductionForecast({ historicalData, currentHenCount });
    return result;
  } catch (e) {
    console.error(e);
    return { error: 'Failed to generate forecast. Please ensure your Genkit environment is configured correctly.' };
  }
}


export async function getFeedForecast(currentBirdCount: {chicks: number; layers: number; dated: number}): Promise<FeedForecastOutput | { error: string }> {
  try {
    const historicalData = JSON.stringify([
        { day: '2023-10-01', feed_type: 'Layer Crumble', consumed_kg: 250 },
        { day: '2023-10-02', feed_type: 'Layer Crumble', consumed_kg: 255 },
        { day: '2023-10-03', feed_type: 'Layer Crumble', consumed_kg: 252 },
        { day: '2023-10-04', feed_type: 'Layer Crumble', consumed_kg: 260 },
        { day: '2023-10-05', feed_type: 'Grower Pellets', consumed_kg: 180 },
        { day: '2023-10-06', feed_type: 'Grower Pellets', consumed_kg: 185 },
        { day: '2023-10-07', feed_type: 'Layer Crumble', consumed_kg: 265 },
        { day: '2023-10-08', feed_type: 'Starter Mash', consumed_kg: 120 },
        { day: '2023-10-09', feed_type: 'Layer Crumble', consumed_kg: 270 },
        { day: '2023-10-10', feed_type: 'Layer Crumble', consumed_kg: 275 },
    ]);
    
    // A mock forecast if the AI call is not configured
    if (!process.env.GENKIT_API_KEY && !process.env.GOOGLE_API_KEY) {
        console.warn("Genkit/Google API key not found. Returning mock feed forecast.");
        const mockForecast = {
            forecast: JSON.stringify([
                { day: 1, predicted_consumption_kg: 278 },
                { day: 2, predicted_consumption_kg: 280 },
                { day: 3, predicted_consumption_kg: 282 },
                { day: 4, predicted_consumption_kg: 285 },
                { day: 5, predicted_consumption_kg: 288 },
                { day: 6, predicted_consumption_kg: 290 },
                { day: 7, predicted_consumption_kg: 292 },
            ]),
        };
        await new Promise(resolve => setTimeout(resolve, 1000)); // simulate network delay
        return mockForecast;
    }

    const result = await feedForecast({ historicalData, currentBirdCount });
    return result;
  } catch (e) {
    console.error(e);
    return { error: 'Failed to generate feed forecast. Please ensure your Genkit environment is configured correctly.' };
  }
}

export async function getBrokenRatePrediction(): Promise<BrokenRatePredictionOutput | { error: string }> {
  try {
    const historicalData = JSON.stringify([
      { date: '2023-10-15', total_eggs: 5000, broken_eggs: 50, feed_change: false, transport_issue: false, weather: 'Normal' },
      { date: '2023-10-16', total_eggs: 5020, broken_eggs: 55, feed_change: false, transport_issue: false, weather: 'Normal' },
      { date: '2023-10-17', total_eggs: 4980, broken_eggs: 150, feed_change: true, transport_issue: false, weather: 'Normal' },
      { date: '2023-10-18', total_eggs: 5050, broken_eggs: 160, feed_change: false, transport_issue: false, weather: 'Normal' },
      { date: '2023-10-19', total_eggs: 5100, broken_eggs: 155, feed_change: false, transport_issue: false, weather: 'Normal' },
      { date: '2023-10-20', total_eggs: 4800, broken_eggs: 250, feed_change: false, transport_issue: true, weather: 'Storm' },
      { date: '2023-10-21', total_eggs: 5150, broken_eggs: 90, feed_change: false, transport_issue: false, weather: 'Normal' },
    ]);

    if (!process.env.GENKIT_API_KEY && !process.env.GOOGLE_API_KEY) {
      console.warn("Genkit/Google API key not found. Returning mock broken rate prediction.");
      const mockPrediction = {
        predictedBrokenRate: 3.5,
        analysis: "The recent spike in broken eggs to 5.2% on Oct 20 correlates strongly with a reported transport issue and stormy weather. The previous increase around Oct 17-19 likely relates to the feed composition change. Expect rates to stabilize around 3.5% if conditions remain normal.",
      };
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockPrediction;
    }

    const result = await brokenRatePrediction({ historicalData });
    return result;
  } catch (e) {
    console.error(e);
    return { error: 'Failed to generate broken rate prediction. Please ensure your Genkit environment is configured correctly.' };
  }
}

export async function getHealthAnomalyAlerts(mortalityData: string, feedConsumptionData: string, eggCollectionData: string): Promise<HealthAnomalyOutput | { error: string }> {
  try {
    if (!process.env.GENKIT_API_KEY && !process.env.GOOGLE_API_KEY) {
      console.warn("Genkit/Google API key not found. Returning mock health alerts.");
      const mockAlerts: HealthAnomalyOutput = {
        alerts: [
          { severity: 'High', description: 'Unusually high mortality spike detected on Oct 20 in Shed C. Immediate investigation recommended.' },
          { severity: 'Medium', description: 'Feed consumption in Shed A has dropped by 15% over the last 3 days. Monitor flock for signs of illness.' },
           { severity: 'Medium', description: 'Significant increase in broken eggs in Shed B over the last 2 days. Check for environmental stressors or nutritional issues.'}
        ],
      };
       await new Promise(resolve => setTimeout(resolve, 1000));
      return mockAlerts;
    }
    
    const result = await healthAnomalyDetection({ mortalityData, feedConsumptionData, eggCollectionData });
    return result;
  } catch (e) {
    console.error(e);
    return { error: 'Failed to generate health anomaly alerts. Please ensure your Genkit environment is configured correctly.' };
  }
}
