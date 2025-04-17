// src/ai/flows/summarize-workflow-output.ts
'use server';

/**
 * @fileOverview Summarizes the output of a completed workflow, highlighting key insights and findings.
 *
 * - summarizeWorkflowOutput - A function that summarizes the workflow output.
 * - SummarizeWorkflowOutputInput - The input type for the summarizeWorkflowOutput function.
 * - SummarizeWorkflowOutputOutput - The return type for the summarizeWorkflowOutput function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SummarizeWorkflowOutputInputSchema = z.object({
  workflowOutput: z.string().describe('The complete output of the workflow to be summarized.'),
});
export type SummarizeWorkflowOutputInput = z.infer<typeof SummarizeWorkflowOutputInputSchema>;

const SummarizeWorkflowOutputOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the key insights and findings from the workflow output.'),
});
export type SummarizeWorkflowOutputOutput = z.infer<typeof SummarizeWorkflowOutputOutputSchema>;

export async function summarizeWorkflowOutput(input: SummarizeWorkflowOutputInput): Promise<SummarizeWorkflowOutputOutput> {
  return summarizeWorkflowOutputFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeWorkflowOutputPrompt',
  input: {
    schema: z.object({
      workflowOutput: z.string().describe('The complete output of the workflow to be summarized.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A concise summary of the key insights and findings from the workflow output.'),
    }),
  },
  prompt: `You are an expert in business intelligence and workflow automation.

  Your task is to summarize the key findings and insights from the following workflow output so that a user can quickly understand the results without having to manually review all the details. Be as concise as possible. Focus on key insights and actionable information.

  Workflow Output:
  {{workflowOutput}}

  Summary:`,
});

const summarizeWorkflowOutputFlow = ai.defineFlow<
  typeof SummarizeWorkflowOutputInputSchema,
  typeof SummarizeWorkflowOutputOutputSchema
>({
  name: 'summarizeWorkflowOutputFlow',
  inputSchema: SummarizeWorkflowOutputInputSchema,
  outputSchema: SummarizeWorkflowOutputOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});
