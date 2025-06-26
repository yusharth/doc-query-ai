import { formatDistanceToNow } from "date-fns";
import {
  Bot,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import Link from "next/link";
import AgentCardActions from "./agent-card-actions";

export interface Agent {
  agent_name: string;
  agent_type: string;
  created_at: string;
  document_metadata: DocumentMetadata;
  task_id: string;
}

export interface DocumentMetadata {
  file_name: string;
  doc_type: string;
}

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const getDocumentIcon = () => {
    switch (agent.document_metadata.doc_type) {
      case "PDF":
        return <FileText className="h-4 w-4 text-red-500" />;
      case "DOCX":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "TXT":
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const createdTime = formatDistanceToNow(new Date(agent.created_at), {
    addSuffix: true,
  });

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="border-b bg-muted/40 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">{agent.agent_name}</h3>
          </div>
          <AgentCardActions agent={agent} />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {getDocumentIcon()}
            <span className="truncate">
              {agent.document_metadata.file_name}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Created {createdTime}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t p-4">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            <span className="text-xs">Active</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              {/* <Link href={`/voice/`}>
                <Mic className="mr-2 h-4 w-4" />
                Voice
              </Link> */}
            </Button>
            <Button size="sm" asChild>
              <Link href={`/chat/${agent.task_id}`}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat
              </Link>
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
