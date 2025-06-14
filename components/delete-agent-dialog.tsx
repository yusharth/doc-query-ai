"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle } from "lucide-react";
// import { deleteAgent } from "@/lib/api"
import { toast } from "@/hooks/use-toast";

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

interface DeleteAgentDialogProps {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAgentDialog({
  agent,
  open,
  onOpenChange,
}: DeleteAgentDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/delete_agent/${agent.task_id}`,
        {
          method: "DELETE",
          headers: {
            accept: "application/json",
          },
        }
      );
      toast({
        title: "Agent deleted",
        description: `${agent.agent_name} has been successfully deleted.`,
      });
      if (response.ok) {
        router.refresh();
      } else {
        throw new Error("Failed to delete agent");
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete the agent. Please try again.",
        variant: "destructive",
      });
      throw new Error("Error connecting to the server");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <div>
              <p>
                Are you sure you want to delete{" "}
                <strong>{agent.agent_name}</strong>?
              </p>
              <p className="text-sm text-muted-foreground">
                This will permanently delete the agent and its associated
                document ({agent.document_metadata.file_name}). This action
                cannot be undone.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Agent"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
