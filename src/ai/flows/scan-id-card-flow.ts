'use server';
/**
 * @fileOverview An AI flow to scan and extract information from an ID card.
 *
 * - scanIdCard - A function that handles the ID card scanning process.
 * - ScanIdCardInput - The input type for the scanIdCard function.
 * - ScanIdCardOutput - The return type for the scanIdCard function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ScanIdCardInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an ID card, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ScanIdCardInput = z.infer<typeof ScanIdCardInputSchema>;

const ScanIdCardOutputSchema = z.object({
  fullName: z.string().describe("The full name of the person on the ID card. If multiple names and surnames are present, combine them all. If not found or unreadable, return an empty string."),
  idNumber: z.string().describe("The ID number (Cédula de Identidad) from the card. It may contain hyphens. If not found or unreadable, return an empty string."),
});
export type ScanIdCardOutput = z.infer<typeof ScanIdCardOutputSchema>;

export async function scanIdCard(input: ScanIdCardInput): Promise<ScanIdCardOutput> {
  return scanIdCardFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scanIdCardPrompt',
  input: {schema: ScanIdCardInputSchema},
  output: {schema: ScanIdCardOutputSchema},
  prompt: `You are an expert OCR system specializing in Nicaraguan ID cards (Cédulas de Identidad).
  Analyze the provided image and extract the following information. The image might be blurry, partial, or at an angle. Do your best to extract the information.
  1. Full Name (Nombres y Apellidos): Combine all names and surnames into a single string.
  2. ID Number (Cédula de Identidad): Extract the ID number exactly as it appears, including any hyphens.

  If you cannot confidently determine the name or the ID number, or if the image does not appear to be a Nicaraguan ID card, return an empty string for the corresponding field. Do not guess or make up information.
  Respond ONLY with the extracted data in JSON format.

  Image to analyze: {{media url=photoDataUri}}`,
});

const scanIdCardFlow = ai.defineFlow(
  {
    name: 'scanIdCardFlow',
    inputSchema: ScanIdCardInputSchema,
    outputSchema: ScanIdCardOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      // This case handles if the model fails to produce any output.
      // We'll return empty strings, which the client-side will handle as a failed scan.
      return { fullName: '', idNumber: '' };
    }
    return output;
  }
);
