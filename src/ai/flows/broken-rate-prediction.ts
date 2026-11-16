'use server';

/**
 * @fileOverview Predicts broken egg rates and analyzes potential causes.
 *
 * - brokenRatePrediction - A function that returns the broken rate prediction and analysis.
 * - BrokenRatePredictionInput - The input type for the brokenRatePrediction function.
 * - BrokenRatePredictionOutput - The return type for the brokenRatePrediction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BrokenRatePredictionInputSchema = z.object({
  historicalData: z
    .string()
    .describe(
      'A JSON string of historical data including daily collection, broken eggs, feed changes, transport issues, and weather.'
    ),
});
export type BrokenRatePredictionInput = z.infer<
  typeof BrokenRatePredictionInputSchema
>;

const BrokenRatePredictionOutputSchema = z.object({
  predictedBrokenRate: z
    .number()
    .describe(
      'The predicted percentage of broken eggs for the next period.'
    ),
  analysis: z
    .string()
    .describe(
      'An analysis of the factors contributing to the broken egg rate, such as feed, weather, or transport quality.'
    ),
});
export type BrokenRatePredictionOutput = z.infer<
  typeof BrokenRatePredictionOutputSchema
>;

export async function brokenRatePrediction(
  input: BrokenRatePredictionInput
): Promise<BrokenRatePredictionOutput> {
  return brokenRatePredictionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'brokenRatePredictionPrompt',
  input: {schema: BrokenRatePredictionInputSchema},
  output: {schema: BrokenRatePredictionOutputSchema},
  prompt: `You are an AI expert in poultry farm analytics. Your task is to analyze historical data to predict the broken egg rate and identify contributing factors.
  
Analyze the provided data to find correlations between the broken egg rate and changes in feed, transport incidents, or extreme weather conditions.

Based on your analysis, provide a predicted broken egg rate (as a percentage) for the next operational period and a brief analysis of the most likely causes for any recent increase in broken eggs.

Historical Data: {{{historicalData}}}`,
});

const brokenRatePredictionFlow = ai.defineFlow(
  {
    name: 'brokenRatePredictionFlow',
    inputSchema: BrokenRatePredictionInputSchema,
    outputSchema: BrokenRatePredictionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
