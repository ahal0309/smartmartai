'use server';

/**
 * @fileOverview Generates a shopping list based on a life event.
 *
 * - generateLifeEventShoppingList - A function that generates a shopping list based on a life event.
 * - GenerateLifeEventShoppingListInput - The input type for the generateLifeEventShoppingList function.
 * - GenerateLifeEventShoppingListOutput - The return type for the generateLifeEventShoppingList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLifeEventShoppingListInputSchema = z.object({
  lifeEvent: z
    .string()
    .describe('The life event to generate a shopping list for (e.g., birthday, wedding, graduation).'),
  numItems: z
    .number()
    .describe('The number of items to include in the shopping list.'),
});
export type GenerateLifeEventShoppingListInput = z.infer<
  typeof GenerateLifeEventShoppingListInputSchema
>;

const GenerateLifeEventShoppingListOutputSchema = z.object({
  shoppingList: z
    .array(z.string())
    .describe('A list of items appropriate for the life event.'),
});
export type GenerateLifeEventShoppingListOutput = z.infer<
  typeof GenerateLifeEventShoppingListOutputSchema
>;

export async function generateLifeEventShoppingList(
  input: GenerateLifeEventShoppingListInput
): Promise<GenerateLifeEventShoppingListOutput> {
  return generateLifeEventShoppingListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLifeEventShoppingListPrompt',
  input: {schema: GenerateLifeEventShoppingListInputSchema},
  output: {schema: GenerateLifeEventShoppingListOutputSchema},
  prompt: `You are a helpful shopping assistant. Generate a shopping list of {{numItems}} items appropriate for a {{lifeEvent}}. Return the list as an array of strings.

For example, if the life event is a birthday and the number of items is 3, you might return [\"cake\", \"balloons\", \"presents\"].`,
});

const generateLifeEventShoppingListFlow = ai.defineFlow(
  {
    name: 'generateLifeEventShoppingListFlow',
    inputSchema: GenerateLifeEventShoppingListInputSchema,
    outputSchema: GenerateLifeEventShoppingListOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
