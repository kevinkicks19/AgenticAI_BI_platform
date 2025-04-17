// src/ai/flows/suggest-agent-config.ts
'use server';

/**
 * @fileOverview Suggests initial configurations for Autogen agents based on a description of the agent's intended role.
 *
 * - suggestAgentConfig - A function that suggests agent configurations.
 * - SuggestAgentConfigInput - The input type for the suggestAgentConfig function.
 * - SuggestAgentConfigOutput - The return type for the suggestAgentConfig function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SuggestAgentConfigInputSchema = z.object({
  agentRoleDescription: z.string().describe('A description of the agent\'s intended role.'),
});
export type SuggestAgentConfigInput = z.infer<typeof SuggestAgentConfigInputSchema>;

const SuggestAgentConfigOutputSchema = z.object({
  suggestedConfig: z.string().describe('The suggested Autogen agent configuration in JSON format.'),
});
export type SuggestAgentConfigOutput = z.infer<typeof SuggestAgentConfigOutputSchema>;

export async function suggestAgentConfig(input: SuggestAgentConfigInput): Promise<SuggestAgentConfigOutput> {
  return suggestAgentConfigFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestAgentConfigPrompt',
  input: {
    schema: z.object({
      agentRoleDescription: z.string().describe('A description of the agent\'s intended role.'),
    }),
  },
  output: {
    schema: z.object({
      suggestedConfig: z.string().describe('The suggested Autogen agent configuration in JSON format.'),
    }),
  },
  prompt: `You are an expert in configuring Autogen agents. A user wants to create an agent with the following role description: {{{agentRoleDescription}}}. Suggest an initial configuration for this agent in JSON format. Make sure the JSON is valid and includes the following keys: name, model, system_message, and llm_config. Provide only the valid JSON. No additional text. Do not include code fences.
`,
});

const suggestAgentConfigFlow = ai.defineFlow<
  typeof SuggestAgentConfigInputSchema,
  typeof SuggestAgentConfigOutputSchema
>({
  name: 'suggestAgentConfigFlow',
  inputSchema: SuggestAgentConfigInputSchema,
  outputSchema: SuggestAgentConfigOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
