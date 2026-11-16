'use server';

/**
 * @fileOverview Forecasts egg production for the next week based on historical data and current hen count.
 *
 * - eggProductionForecast - A function that returns the egg production forecast.
 * - EggProductionForecastInput - The input type for the eggProductionForecast function.
 * - EggProductionForecastOutput - The return type for the eggProductionForecast function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EggProductionForecastInputSchema = z.object({
  historicalData: z
    .string()
    .describe(
      'Historical egg production data as a JSON string, including daily egg counts.'
    ),
  currentHenCount: z
    .number()
    .describe('The current number of active laying hens.'),
});
export type EggProductionForecastInput = z.infer<
  typeof EggProductionForecastInputSchema
>;

const EggProductionForecastOutputSchema = z.object({
  forecast: z
    .string()
    .describe(
      'A JSON string containing the predicted egg production for the next 7 days.'
    ),
  confidenceInterval: z
    .string()
    .describe(
      'A JSON string containing the confidence interval for the forecast.'
    ),
});
export type EggProductionForecastOutput = z.infer<
  typeof EggProductionForecastOutputSchema
>;

export async function eggProductionForecast(
  input: EggProductionForecastInput
): Promise<EggProductionForecastOutput> {
  return eggProductionForecastFlow(input);
}

const prompt = ai.definePrompt({
  name: 'eggProductionForecastPrompt',
  input: {schema: EggProductionForecastInputSchema},
  output: {schema: EggProductionForecastOutputSchema},
  prompt: `You are an AI assistant specialized in poultry management.  Given the historical egg production data and the current number of laying hens, provide a forecast for the next 7 days and a confidence interval. Respond with a JSON format containing both forecast and confidenceInterval.

Current number of laying hens: {{{currentHenCount}}}
Historical Data: {{{historicalData}}}`,
});

const eggProductionForecastFlow = ai.defineFlow(
  {
    name: 'eggProductionForecastFlow',
    inputSchema: EggProductionForecastInputSchema,
    outputSchema: EggProductionForecastOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
