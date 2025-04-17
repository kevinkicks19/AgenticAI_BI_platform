'use client';

import {Icons} from '@/components/icons';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import {Button} from '@/components/ui/button';
import {useState} from 'react';
import {coachingAgent, CoachingAgentOutput} from '@/ai/flows/coaching-agent-flow';
import {Textarea} from '@/components/ui/textarea';

export default function Home() {
  const [messages, setMessages] = useState<
    {text: string; type: 'user' | 'agent'}[]
  >([]);
  const [input, setInput] = useState('');
  const [problemAnalysis, setProblemAnalysis] = useState<
    CoachingAgentOutput | null
  >(null);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {text: input, type: 'user'} as const;
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const analysis = await coachingAgent({initialUserMessage: input});
      setProblemAnalysis(analysis);
      setMessages(prev => [
        ...prev,
        {
          text: `Problem Category: ${analysis.problemCategory}\nProblem Description: ${analysis.problemDescription}\nUser Goals: ${analysis.userGoals}`,
          type: 'agent',
        },
      ]);
    } catch (error) {
      console.error('Error during coaching agent execution:', error);
      setMessages(prev => [
        ...prev,
        {text: 'Error analyzing the problem.', type: 'agent'},
      ]);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarTrigger />
          <h2>AutoIntellect</h2>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="#" isActive>
                <Icons.layoutDashboard />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#">
                <Icons.agent />
                <span>Agents</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#">
                <Icons.workflow />
                <span>Workflows</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#">
                <Icons.fileText />
                <span>Summaries</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton href="#">
                <Icons.activity />
                <span>Activity</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter></SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col h-full">
          <div className="flex-1 p-4">
            <h1 className="text-2xl font-bold">Coaching Agent</h1>
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-100 text-blue-800 ml-auto w-fit'
                      : 'bg-gray-100 text-gray-800 mr-auto w-fit'
                  }`}
                >
                  {message.text}
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 flex space-x-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Enter your business problem..."
              className="flex-1 rounded-md"
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
