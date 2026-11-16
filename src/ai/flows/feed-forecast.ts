'use server';

/**
 * @fileOverview Forecasts feed consumption for the next week based on historical data and current bird count.
 *
 * - feedForecast - A function that returns the feed consumption forecast.
 * - FeedForecastInput - The input type for the feedForecast function.
 * - FeedForecastOutput - The return type for the feedForecast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FeedForecastInputSchema = z.object({
  historicalData: z
    .string()
    .describe(
      'Historical feed consumption data as a JSON string, including daily feed type and quantity consumed in kg.'
    ),
  currentBirdCount: z.object({
    chicks: z.number().describe('The current number of chicks.'),
    layers: z.number().describe('The current number of laying hens.'),
    dated: z.number().describe('The current number of dated hens.'),
  }).describe('The current count of birds, categorized by type.'),
});
export type FeedForecastInput = z.infer<
  typeof FeedForecastInputSchema
>;

const FeedForecastOutputSchema = z.object({
  forecast: z
    .string()
    .describe(
      'A JSON string containing the predicted feed consumption in kg for the next 7 days.'
    ),
});
export type FeedForecastOutput = z.infer<
  typeof FeedForecastOutputSchema
>;

export async function feedForecast(
  input: FeedForecastInput
): Promise<FeedForecastOutput> {
  return feedForecastFlow(input);
}

const prompt = ai.definePrompt({
  name: 'feedForecastPrompt',
  input: {schema: FeedForecastInputSchema},
  output: {schema: FeedForecastOutputSchema},
  prompt: `You are an AI assistant specialized in poultry farm management and logistics. Given the historical feed consumption data and the current number of birds, provide a consumption forecast for the next 7 days. Take into account that chicks eat less than layers. Respond with a JSON object containing a 'forecast' key. The value should be a JSON string representing an array of objects, each with 'day' and 'predicted_consumption_kg' keys.

Current Bird Count:
Chicks: {{{currentBirdCount.chicks}}}
Layers: {{{currentBirdCount.layers}}}
Dated: {{{currentBirdCount.dated}}}

Historical Data: {{{historicalData}}}`,
});

const feedForecastFlow = ai.defineFlow(
  {
    name: 'feedForecastFlow',
    inputSchema: FeedForecastInputSchema,
    outputSchema: FeedForecastOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
