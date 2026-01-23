'use server';
/**
 * @fileOverview A flow to personalize the UI of the login screen based on user preferences.
 *
 * - personalizeUILoginScreen - A function that personalizes the login screen UI.
 * - PersonalizeUILoginScreenInput - The input type for the personalizeUILoginScreen function.
 * - PersonalizeUILoginScreenOutput - The return type for the personalizeUILoginScreen function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizeUILoginScreenInputSchema = z.object({
  userPreferences: z
    .string()
    .describe("A description of the user's UI preferences, such as preferred colors, layouts, or themes."),
  pastInteractions: z
    .string()
    .describe('A summary of the user past interactions with the app.'),
});
export type PersonalizeUILoginScreenInput = z.infer<typeof PersonalizeUILoginScreenInputSchema>;

const PersonalizeUILoginScreenOutputSchema = z.object({
  backgroundColor: z
    .string()
    .describe('The background color for the login screen in hex format (e.g., #F8E7EB).'),
  primaryColor: z
    .string()
    .describe('The primary color for the login screen in hex format (e.g., #F472B6).'),
  accentColor: z
    .string()
    .describe('The accent color for the login screen in hex format (e.g., #E699FF).'),
  fontHeadline: z.string().describe('The font for headlines (e.g., Poppins).'),
  fontBody: z.string().describe('The font for body text (e.g., PT Sans).'),
  layoutSuggestions: z
    .string()
    .describe('Suggestions for the layout of the login screen, such as element placement and spacing.'),
  animationSuggestions: z
    .string()
    .describe('Suggestions for animations and transitions to enhance the user experience.'),
});
export type PersonalizeUILoginScreenOutput = z.infer<typeof PersonalizeUILoginScreenOutputSchema>;

export async function personalizeUILoginScreen(
  input: PersonalizeUILoginScreenInput
): Promise<PersonalizeUILoginScreenOutput> {
  return personalizeUILoginScreenFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizeUILoginScreenPrompt',
  input: {schema: PersonalizeUILoginScreenInputSchema},
  output: {schema: PersonalizeUILoginScreenOutputSchema},
  prompt: `You are an expert UI/UX designer specializing in personalizing user interfaces.

  Based on the user's preferences and past interactions, suggest visual elements for the login screen, including background color, primary color, accent color, font pairing, layout, and animation suggestions.

  User Preferences: {{{userPreferences}}}
  Past Interactions: {{{pastInteractions}}}

  Please provide the output in JSON format, following the schema descriptions for each field.
  Ensure the color values are in hex format.
`,
});

const personalizeUILoginScreenFlow = ai.defineFlow(
  {
    name: 'personalizeUILoginScreenFlow',
    inputSchema: PersonalizeUILoginScreenInputSchema,
    outputSchema: PersonalizeUILoginScreenOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
