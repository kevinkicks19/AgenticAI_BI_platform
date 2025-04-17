'use server';

/**
 * @fileOverview Routes the problem inception data to the appropriate subsequent agents.
 *
 * - routeProblemInception - A function that routes the problem inception data.
 * - RouteProblemInceptionInput - The input type for the routeProblemInception function.
 * - RouteProblemInceptionOutput - The return type for the routeProblemInception function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const RouteProblemInceptionInputSchema = z.object({
  problemCategory: z.string().describe('The high level category of the problem.'),
  problemDescription: z.string().describe('A detailed description of the user\'s business problem, as understood by the coaching agent.'),
  userGoals: z.string().describe('The goals the user has with respect to the problem.'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'agent']),
    content: z.string(),
  })).describe('The complete conversation history between the user and the coaching agent.'),
  initialUserMessage: z.string().describe('The initial message from the user.'),
});
export type RouteProblemInceptionInput = z.infer<typeof RouteProblemInceptionInputSchema>;

const RouteProblemInceptionOutputSchema = z.object({
  agents: z.array(z.string()).describe('The list of agents to which the problem inception data should be routed.'),
});
export type RouteProblemInceptionOutput = z.infer<typeof RouteProblemInceptionOutputSchema>;

export async function routeProblemInception(input: RouteProblemInceptionInput): Promise<void> {
  await routeProblemInceptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'routeProblemInceptionPrompt',
  input: {
    schema: z.object({
      problemCategory: z.string().describe('The high level category of the problem.'),
      problemDescription: z.string().describe('A detailed description of the user\'s business problem, as understood by the coaching agent.'),
      userGoals: z.string().describe('The goals the user has with respect to the problem.'),
      conversationHistory: z.array(z.object({
        role: z.enum(['user', 'agent']),
        content: z.string(),
      })).describe('The complete conversation history between the user and the coaching agent.'),
      initialUserMessage: z.string().describe('The initial message from the user.'),
    }),
  },
  output: {
    schema: z.object({
      agents: z.array(z.string()).describe('The list of agents to which the problem inception data should be routed.'),
    }),
  },
  prompt: `You are an expert in routing problem inception data to the appropriate subsequent agents.

  Based on the following problem inception data, determine which agents should be used to create a problem inception document.

  Problem Category: {{problemCategory}}
  Problem Description: {{problemDescription}}
  User Goals: {{userGoals}}
  Conversation History:
  {{#each conversationHistory}}
    {{role}}: {{content}}
  {{/each}}
  Initial User Message: {{initialUserMessage}}

  The available agents are:
  - problemInceptionDocumentAgent: This agent is responsible for creating a problem inception document.

  Respond with a JSON object containing a list of agents to which the problem inception data should be routed.
  Example: { "agents": ["problemInceptionDocumentAgent"] }`,
});

const routeProblemInceptionFlow = ai.defineFlow<
  typeof RouteProblemInceptionInputSchema,
  typeof RouteProblemInceptionOutputSchema
>({
  name: 'routeProblemInceptionFlow',
  inputSchema: RouteProblemInceptionInputSchema,
  outputSchema: RouteProblemInceptionOutputSchema,
}, async input => {
  const {output} = await prompt(input);

  // TODO: Call the agents specified in the output.agents array.
  console.log('Routing to agents:', output!.agents);

  return output!;
});
