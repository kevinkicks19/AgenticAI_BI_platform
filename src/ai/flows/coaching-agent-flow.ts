'use server';

/**
 * @fileOverview A coaching agent that identifies the user's business problem.
 *
 * - coachingAgent - A function that handles the coaching process.
 * - CoachingAgentInput - The input type for the coachingAgent function.
 * - CoachingAgentOutput - The return type for the coachingAgent function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const CoachingAgentInputSchema = z.object({
  initialUserMessage: z.string().describe('The initial message from the user describing their business problem.'),
});
export type CoachingAgentInput = z.infer<typeof CoachingAgentInputSchema>;

const CoachingAgentOutputSchema = z.object({
  problemDescription: z.string().describe('A detailed description of the user\'s business problem, as understood by the coaching agent.'),
  problemCategory: z.string().describe('The high level category of the problem.'),
  userGoals: z.string().describe('The goals the user has with respect to the problem.'),
});
export type CoachingAgentOutput = z.infer<typeof CoachingAgentOutputSchema>;

export async function coachingAgent(input: CoachingAgentInput): Promise<CoachingAgentOutput> {
  return coachingAgentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'coachingAgentPrompt',
  input: {
    schema: z.object({
      initialUserMessage: z.string().describe('The initial message from the user describing their business problem.'),
    }),
  },
  output: {
    schema: z.object({
      problemDescription: z.string().describe('A detailed description of the user\'s business problem, as understood by the coaching agent.'),
      problemCategory: z.string().describe('The high level category of the problem.'),
      userGoals: z.string().describe('The goals the user has with respect to the problem.'),
    }),
  },
  prompt: `You are a business coach whose goal is to help the user clarify their business problem. You will engage the user in a conversation, asking questions to help them think critically about their business.

  Here are some example questions you might ask:
  - What are the biggest challenges you're currently facing?
  - What specific areas are you hoping to improve?
  - What are your goals for your business?
  - What are the constraints?
  - What are the key performance indicators (KPIs) that you're tracking?
  - What is the context?

  Once you have a good understanding of their problem, you will respond with:
  - problemDescription: A detailed description of the user's business problem.
  - problemCategory: The high level category of the problem.
  - userGoals: The goals the user has with respect to the problem.

  The user's initial message is:
  {{initialUserMessage}}

  Your response:`,
});

const coachingAgentFlow = ai.defineFlow<
  typeof CoachingAgentInputSchema,
  typeof CoachingAgentOutputSchema
>({
  name: 'coachingAgentFlow',
  inputSchema: CoachingAgentInputSchema,
  outputSchema: CoachingAgentOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
