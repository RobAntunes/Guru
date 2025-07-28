import React, { useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Brain,
  Home,
  FolderOpen,
  Download,
  FlaskConical,
  Sparkles,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronRight,
  BookOpen,
  Dna,
  Atom,
  Bot,
  Activity
} from 'lucide-react';
import { ProjectSelector } from './ProjectSelector';
import { Project } from '../services/project-storage';

interface AppLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

export function AppLayout({ children, activeView, onViewChange }: AppLayoutProps) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  const menuItems = [
    {
      group: "Overview",
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, description: 'System overview' },
      ]
    },
    {
      group: "Core Features",
      items: [
        { id: 'home', label: 'Knowledge', icon: BookOpen, description: 'Central knowledge repository' },
        { id: 'thinking', label: 'Thinking', icon: Brain, description: 'Multi-stage reasoning & ideas' },
        { id: 'learning', label: 'Adaptive Learning', icon: FlaskConical, description: 'AI experimentation & strategies' },
        { id: 'tasks', label: 'Living Tasks', icon: Dna, description: 'Evolving task optimization' },
        { id: 'memories', label: 'Memory', icon: Atom, description: 'Memory synthesis' },
      ]
    },
    {
      group: "System",
      items: [
        { id: 'settings', label: 'Settings', icon: Settings, description: 'Configure Guru' },
        { id: 'help', label: 'Help & Docs', icon: HelpCircle, description: 'Get help' },
      ]
    }
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <Sidebar>
          <SidebarHeader>
            <div className="flex flex-col gap-3 px-2 pt-1 pb-2">
              <div className="flex flex-col">
                <h1 className="text-lg font-light">Guru</h1>
              </div>
              <ProjectSelector onProjectChange={setCurrentProject} />
            </div>
          </SidebarHeader>

          <SidebarContent>
            {menuItems.map((section) => (
              <SidebarGroup key={section.group}>
                <SidebarGroupLabel className="text-muted-foreground/70">{section.group}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          isActive={activeView === item.id}
                          onClick={() => onViewChange(item.id)}
                          tooltip={item.description}
                          className="w-full text-muted-foreground hover:text-muted-foreground data-[active=true]:text-muted-foreground"
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="flex-1 font-light">{item.label}</span>
                          {activeView === item.id && (
                            <ChevronRight className="h-3 w-3 ml-auto" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-14 items-center gap-4 border-b px-6">
            <SidebarTrigger className="-ml-1" />
            <h2 className="text-lg font-light">
              {menuItems
                .flatMap(s => s.items)
                .find(item => item.id === activeView)?.label || 'Guru'}
            </h2>
            <div className="flex-1" />
          </header>

          <main className="flex-1 overflow-auto mx-6 h-full">
            <div className="pt-16  mx-auto h-full">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}