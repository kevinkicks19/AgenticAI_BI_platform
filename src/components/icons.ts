import {
  ArrowRight,
  Check,
  ChevronsUpDown,
  Circle,
  Copy,
  Edit,
  ExternalLink,
  File,
  HelpCircle,
  Home,
  Loader2,
  Mail,
  MessageSquare,
  Moon,
  Plus,
  PlusCircle,
  Search,
  Server,
  Settings,
  Share2,
  Shield,
  Sun,
  Trash,
  User,
  Workflow,
  Activity,
  ListChecks,
  LayoutDashboard,
  Wrench,
  FileText,
  X,
  Cog
} from 'lucide-react';
import React from 'react';

// Define custom inline SVG icons
const AgentIcon = () => {
  return React.createElement(
    'svg',
    {
      width: '24',
      height: '24',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className: 'lucide lucide-user-cog',
    },
    React.createElement('path', {
      d: 'M16 18c-1.33 0-2.66.67-3.52 1.77',
      stroke: 'currentColor',
    }),
    React.createElement('path', {
      d: 'M8 6c0-1.66 0-3 2-3s2 1.34 2 3-1.34 3-3 3',
      stroke: 'currentColor',
    }),
    React.createElement('path', {
      d: 'M22 19a9 9 0 0 1-9 2 9 9 0 0 1-9-2',
      stroke: 'currentColor',
    }),
    React.createElement('circle', {
      cx: '19',
      cy: '7',
      r: '2',
      stroke: 'currentColor',
    }),
    React.createElement('path', { d: 'M19 5v2', stroke: 'currentColor' }),
    React.createElement('path', {
      d: 'M17.76 8.24 17 9',
      stroke: 'currentColor',
    }),
    React.createElement('path', {
      d: 'M20.24 5.76 21 5',
      stroke: 'currentColor',
    }),
    React.createElement('path', { d: 'M21 9h-2', stroke: 'currentColor' }),
    React.createElement('path', {
      d: 'M20.24 10.24 19 11',
      stroke: 'currentColor',
    }),
    React.createElement('path', { d: 'M17 5h2', stroke: 'currentColor' })
  );
};

const Icons = {
  arrowRight: ArrowRight,
  check: Check,
  chevronDown: ChevronsUpDown,
  circle: Circle,
  workflow: Workflow,
  close: X,
  copy: Copy,
  dark: Moon,
  edit: Edit,
  externalLink: ExternalLink,
  file: File,
  help: HelpCircle,
  home: Home,
  light: Sun,
  loader: Loader2,
  mail: Mail,
  messageSquare: MessageSquare,
  plus: Plus,
  plusCircle: PlusCircle,
  search: Search,
  server: Server,
  settings: Settings,
  share: Share2,
  shield: Shield,
  spinner: Loader2,
  trash: Trash,
  user: User,
  agent: AgentIcon,
  activity: Activity,
  listChecks: ListChecks,
  layoutDashboard: LayoutDashboard,
  wrench: Wrench,
  agentCog: Cog,
  fileText: FileText,
};

export {Icons};

    