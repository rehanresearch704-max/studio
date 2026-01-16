'use server';

/**
 * @fileOverview A flow to classify incident types based on voice transcript.
 *
 * - classifyIncidentType - A function that classifies the incident type.
 * - ClassifyIncidentTypeInput - The input type for the classifyIncidentType function.
 * - ClassifyIncidentTypeOutput - The return type for the classifyIncidentType function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyIncidentTypeInputSchema = z.object({
  audioTranscript: z
    .string()
    .describe('The audio transcript of the incident reported by the security guard.'),
});

export type ClassifyIncidentTypeInput = z.infer<typeof ClassifyIncidentTypeInputSchema>;

const ClassifyIncidentTypeOutputSchema = z.object({
  incidentType: z
    .enum(['Verbal Abuse', 'Intimidation', 'Micro-aggressions', 'Other'])
    .describe('The classified type of incident.'),
});

export type ClassifyIncidentTypeOutput = z.infer<typeof ClassifyIncidentTypeOutputSchema>;

export async function classifyIncidentType(
  input: ClassifyIncidentTypeInput
): Promise<ClassifyIncidentTypeOutput> {
  return classifyIncidentTypeFlow(input);
}

const classifyIncidentTypePrompt = ai.definePrompt({
  name: 'classifyIncidentTypePrompt',
  input: {schema: ClassifyIncidentTypeInputSchema},
  output: {schema: ClassifyIncidentTypeOutputSchema},
  prompt: `You are an AI assistant that helps classify incident types based on the audio transcript provided by a security guard. Determine whether the incident falls under 'Verbal Abuse', 'Intimidation', 'Micro-aggressions', or 'Other'.

Audio Transcript: {{{audioTranscript}}}

Based on the audio transcript, classify the incident type.  Respond ONLY with one of the following options: 'Verbal Abuse', 'Intimidation', 'Micro-aggressions', or 'Other'. No explanation is required.
`,
});

const classifyIncidentTypeFlow = ai.defineFlow(
  {
    name: 'classifyIncidentTypeFlow',
    inputSchema: ClassifyIncidentTypeInputSchema,
    outputSchema: ClassifyIncidentTypeOutputSchema,
  },
  async input => {
    const {output} = await classifyIncidentTypePrompt(input);
    return output!;
  }
);
