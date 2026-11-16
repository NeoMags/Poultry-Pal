'use server';

/**
 * @fileOverview Detects health anomalies based on mortality, feed, and broken egg data.
 *
 * - healthAnomalyDetection - A function that returns potential health alerts.
 * - HealthAnomalyInput - The input type for the healthAnomalyDetection function.
 * - HealthAnomalyOutput - The return type for the healthAnomalyDetection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const HealthAnomalyInputSchema = z.object({
  mortalityData: z
    .string()
    .describe(
      'A JSON string of recent mortality logs, including date and quantity.'
    ),
  feedConsumptionData: z
    .string()
    .describe(
      'A JSON string of recent feed consumption logs, including date and quantity.'
    ),
  eggCollectionData: z
    .string()
    .describe(
      'A JSON string of recent egg collection logs, including date, total eggs, and damaged eggs.'
    ),
});
export type HealthAnomalyInput = z.infer<typeof HealthAnomalyInputSchema>;

const HealthAnomalyOutputSchema = z.object({
  alerts: z
    .array(
      z.object({
        severity: z
          .enum(['High', 'Medium', 'Low'])
          .describe('The severity of the alert.'),
        description: z
          .string()
          .describe('A detailed description of the potential health issue.'),
      })
    )
    .describe('A list of potential health anomaly alerts.'),
});
export type HealthAnomalyOutput = z.infer<typeof HealthAnomalyOutputSchema>;

export async function healthAnomalyDetection(
  input: HealthAnomalyInput
): Promise<HealthAnomalyOutput> {
  return healthAnomalyDetectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'healthAnomalyDetectionPrompt',
  input: {schema: HealthAnomalyInputSchema},
  output: {schema: HealthAnomalyOutputSchema},
  prompt: `You are an expert AI poultry veterinarian. Your task is to analyze recent farm data to detect potential health anomalies. Look for sudden spikes in mortality, significant drops in feed consumption, or an unusual increase in the rate of broken/damaged eggs. These are key indicators of potential health issues, stress, or nutritional deficiencies.

Analyze the provided data and generate a list of alerts if any anomalies are detected. If there are no significant anomalies, return an empty array for the alerts.

Recent Mortality Data:
{{{mortalityData}}}

Recent Feed Consumption Data:
{{{feedConsumptionData}}}

Recent Egg Collection Data (including damaged eggs):
{{{eggCollectionData}}}
`,
});

const healthAnomalyDetectionFlow = ai.defineFlow(
  {
    name: 'healthAnomalyDetectionFlow',
    inputSchema: HealthAnomalyInputSchema,
    outputSchema: HealthAnomalyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
