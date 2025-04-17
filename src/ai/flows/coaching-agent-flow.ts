'use server';

/**
 * @fileOverview A coaching agent that identifies the user's business problem through iterative questioning.
 *
 * - coachingAgent - A function that handles the coaching process.
 * - CoachingAgentInput - The input type for the coachingAgent function.
 * - CoachingAgentOutput - The return type for the CoachingAgent function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {routeProblemInception} from '@/ai/flows/route-problem-inception';

const CoachingAgentInputSchema = z.object({
  initialUserMessage: z.string().describe('The message from the user describing their business problem or their response to the coaching agent\'s questions.'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'agent']),
    content: z.string(),
  })).optional().describe('A list of previous messages in the conversation.'),
  problemCategory: z.string().optional().describe('The high level category of the problem.'),
  problemDescription: z.string().optional().describe('A detailed description of the user\'s business problem, as understood by the coaching agent.'),
  userGoals: z.string().optional().describe('The goals the user has with respect to the problem.'),
  numQuestionsAsked: z.number().optional().describe('The number of questions the agent has already asked.'),
});
export type CoachingAgentInput = z.infer<typeof CoachingAgentInputSchema>;

const CoachingAgentOutputSchema = z.object({
  problemDescription: z.string().describe('A detailed description of the user\'s business problem, refined after considering the conversation history.'),
  problemCategory: z.string().describe('The high level category of the problem.'),
  userGoals: z.string().describe('The goals the user has with respect to the problem, refined after considering the conversation history.'),
  followUpQuestion: z.string().optional().describe('A question to ask the user to further refine your understanding of their problem.'),
  isFinalAnalysis: z.boolean().describe('Whether this analysis is final or requires further refinement via follow-up questions.'),
  numQuestionsAsked: z.number().describe('The number of questions the agent has asked so far.'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'agent']),
    content: z.string(),
  })).describe('The complete conversation history between the user and the coaching agent.'),
  initialUserMessage: z.string().describe('The initial message from the user.'),
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
      numQuestionsAsked: z.number().optional().describe('The number of questions the agent has already asked.'),
    }),
  },
  output: {
    schema: z.object({
      problemDescription: z.string().describe('A detailed description of the user\'s business problem, refined after considering the conversation history.'),
      problemCategory: z.string().describe('The high level category of the problem.'),
      userGoals: z.string().describe('The goals the user has with respect to the problem, refined after considering the conversation history.'),
      followUpQuestion: z.string().optional().describe('A question to ask the user to further refine your understanding of their problem.'),
      isFinalAnalysis: z.boolean().describe('Whether this analysis is final or requires further refinement via follow-up questions.'),
      numQuestionsAsked: z.number().describe('The number of questions the agent has asked so far.'),
    }),
  },
  prompt: `You are a business coach whose goal is to help the user clarify their business problem through a series of iterative questions. You will engage the user in a conversation, asking questions to help them think critically about their business. After each response from the user, you will refine your understanding of the problem and goals. You should always ask at least 5 questions before finalizing the analysis. Focus on the following areas to guide your questions:

1. Problem Statement: Understand the core issue the user is facing.
2. Key Challenges: Identify the main obstacles preventing resolution.
3. Business Impact: Determine the consequences of not addressing the problem.
4. Stakeholders: Recognize who is involved or affected by the problem.
5. Constraints: Acknowledge any limitations or restrictions affecting potential solutions.

Here are some example questions you might ask, tailored to the above areas:

*Problem Statement:*
  - Can you elaborate on the core problem your business is facing?
  - What specific area of the business is most affected by this problem?

*Key Challenges:*
  - What are the biggest challenges you're currently facing in addressing this problem?
  - What internal or external obstacles are hindering progress?

*Business Impact:*
  - What is the financial impact of this problem on your business?
  - How does this problem affect your customer experience or satisfaction?
  - What are the potential long-term consequences if this problem is not resolved?

*Stakeholders:*
  - Who are the key stakeholders involved in this problem?
  - How does this problem affect different teams or departments within the organization?
  - Whose input or buy-in is crucial for implementing a solution?

*Constraints:*
  - What are the resource constraints (budget, time, personnel) that might limit your options?
  - Are there any technical or regulatory constraints that need to be considered?

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
  - followUpQuestion: If the problem and goals are not yet clear and you have asked less than 5 questions, ask a question to further refine your understanding. Otherwise, this field should be left blank.
  - isFinalAnalysis: boolean value representing whether this analysis is final or requires further refinement via follow-up questions. If followUpQuestion is not empty, isFinalAnalysis should be false.
  - numQuestionsAsked: The number of questions you have asked so far.

The user's initial message is:
{{initialUserMessage}}

If you have already asked questions in the past, take into account the user's previous message and conversation history.

You have asked {{numQuestionsAsked}} questions so far.

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
  const {output} = await prompt({
    ...input,
    numQuestionsAsked: input.numQuestionsAsked ? input.numQuestionsAsked : 0,
  });

  const numQuestionsAsked = (output!.numQuestionsAsked ? output!.numQuestionsAsked : 0) + 1;

  const coachingAgentOutput = {
    ...output!,
    numQuestionsAsked: numQuestionsAsked,
    conversationHistory: input.conversationHistory ? input.conversationHistory : [],
    initialUserMessage: input.initialUserMessage,
  };

  if (coachingAgentOutput.isFinalAnalysis) {
    // Call the routing agent to determine which agents should process the output.
    await routeProblemInception({
      problemCategory: coachingAgentOutput.problemCategory,
      problemDescription: coachingAgentOutput.problemDescription,
      userGoals: coachingAgentOutput.userGoals,
      conversationHistory: coachingAgentOutput.conversationHistory,
      initialUserMessage: coachingAgentOutput.initialUserMessage,
    });
  }

  return coachingAgentOutput;
});
