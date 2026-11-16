'use server';

/**
 * @fileOverview This file defines a Genkit flow for optimizing a customer's shopping route within a supermarket.
 *
 * - optimizeShoppingRoute - A function that takes a list of items and the supermarket layout as input and returns an optimized route.
 * - OptimizeShoppingRouteInput - The input type for the optimizeShoppingRoute function.
 * - OptimizeShoppingRouteOutput - The return type for the optimizeShoppingRoute function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeShoppingRouteInputSchema = z.object({
  items: z.array(z.string()).describe('The list of items to buy.'),
  supermarketLayout: z.string().describe('The layout of the supermarket as a string.'),
});
export type OptimizeShoppingRouteInput = z.infer<typeof OptimizeShoppingRouteInputSchema>;

const OptimizeShoppingRouteOutputSchema = z.object({
  optimizedRoute: z.array(z.string()).describe('The optimized shopping route as a list of locations in the supermarket.'),
  estimatedTime: z.number().describe('The estimated time to complete the shopping route in minutes.'),
});
export type OptimizeShoppingRouteOutput = z.infer<typeof OptimizeShoppingRouteOutputSchema>;

export async function optimizeShoppingRoute(input: OptimizeShoppingRouteInput): Promise<OptimizeShoppingRouteOutput> {
  return optimizeShoppingRouteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeShoppingRoutePrompt',
  input: {schema: OptimizeShoppingRouteInputSchema},
  output: {schema: OptimizeShoppingRouteOutputSchema},
  prompt: `You are an AI shopping assistant that optimizes shopping routes within a supermarket.

  Given the following list of items to buy:
  {{#each items}}
  - {{{this}}}
  {{/each}}

  And the following supermarket layout:
  {{supermarketLayout}}

  Generate an optimized shopping route and estimate the time it will take to complete the shopping route.
  Return the route as a list of locations in the supermarket and the time in minutes.
  Make sure the output matches the output schema.
  `,
});

const optimizeShoppingRouteFlow = ai.defineFlow(
  {
    name: 'optimizeShoppingRouteFlow',
    inputSchema: OptimizeShoppingRouteInputSchema,
    outputSchema: OptimizeShoppingRouteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

