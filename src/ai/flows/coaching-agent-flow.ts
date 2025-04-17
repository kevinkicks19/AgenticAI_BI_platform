'use server';

/**
 * @fileOverview A coaching agent that identifies the user's business problem through iterative questioning.
 *
 * - coachingAgent - A function that handles the coaching process.
 * - CoachingAgentInput - The input type for the coachingAgent function.
 * - CoachingAgentOutput - The return type for the coachingAgent function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const CoachingAgentInputSchema = z.object({
  initialUserMessage: z.string().describe('The message from the user describing their business problem or their response to the coaching agent\'s questions.'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'agent']),
    content: z.string(),
  })).optional().describe('A list of previous messages in the conversation.'),
  problemCategory: z.string().optional().describe('The high level category of the problem.'),
  problemDescription: z.string().optional().describe('A detailed description of the user\'s business problem, as understood by the coaching agent.'),
  userGoals: z.string().optional().describe('The goals the user has with respect to the problem.'),
});
export type CoachingAgentInput = z.infer<typeof CoachingAgentInputSchema>;

const CoachingAgentOutputSchema = z.object({
  problemDescription: z.string().describe('A detailed description of the user\'s business problem, refined after considering the conversation history.'),
  problemCategory: z.string().describe('The high level category of the problem.'),
  userGoals: z.string().describe('The goals the user has with respect to the problem, refined after considering the conversation history.'),
  followUpQuestion: z.string().optional().describe('A question to ask the user to further refine the understanding of their problem.'),
  isFinalAnalysis: z.boolean().describe('Whether this analysis is final or requires further refinement via follow-up questions.'),
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
      conversationHistory: z.array(z.object({
        role: z.enum(['user', 'agent']),
        content: z.string(),
      })).optional().describe('A list of previous messages in the conversation.'),
      problemCategory: z.string().optional().describe('The high level category of the problem.'),
      problemDescription: z.string().optional().describe('A detailed description of the user\'s business problem, as understood by the coaching agent.'),
      userGoals: z.string().optional().describe('The goals the user has with respect to the problem.'),
    }),
  },
  output: {
    schema: z.object({
      problemDescription: z.string().describe('A detailed description of the user\'s business problem, refined after considering the conversation history.'),
      problemCategory: z.string().describe('The high level category of the problem.'),
      userGoals: z.string().describe('The goals the user has with respect to the problem, refined after considering the conversation history.'),
      followUpQuestion: z.string().optional().describe('A question to ask the user to further refine the understanding of their problem.'),
      isFinalAnalysis: z.boolean().describe('Whether this analysis is final or requires further refinement via follow-up questions.'),
    }),
  },
  prompt: `You are a business coach whose goal is to help the user clarify their business problem through a series of iterative questions. You will engage the user in a conversation, asking questions to help them think critically about their business. After each response from the user, you will refine your understanding of the problem and goals.

Here are some example questions you might ask:
  - What are the biggest challenges you're currently facing?
  - What specific areas are you hoping to improve?
  - What are your goals for your business?
  - What are the constraints?
  - What are the key performance indicators (KPIs) that you're tracking?
  - What is the context?

Previous conversation history, if any:
{{#if conversationHistory}}
  {{#each conversationHistory}}
    {{role}}: {{content}}
  {{/each}}
{{else}}
  No previous conversation.
{{/if}}

Based on the user's initial message and the conversation history, if any, respond with:
  - problemDescription: A detailed description of the user's business problem, refined after considering the conversation history.
  - problemCategory: The high level category of the problem.
  - userGoals: The goals the user has with respect to the problem, refined after considering the conversation history.
  - followUpQuestion: If the problem and goals are not yet clear, ask a question to further refine your understanding. Otherwise, this field should be left blank.
  - isFinalAnalysis: boolean value representing whether this analysis is final or requires further refinement via follow-up questions. If followUpQuestion is not empty, isFinalAnalysis should be false.

The user's initial message is:
{{initialUserMessage}}

If you have already asked questions in the past, take into account the user's previous message and conversation history.

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
