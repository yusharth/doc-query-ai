"use client";

import { cn } from "@/lib/utils";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/file-uploader";
import { MobileBreadcrumb } from "@/components/mobile-breadcrumb";
import { Bot, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface CreateAgentPageProps {
  onMenuClick?: () => void;
}

const agentTypes = [
  {
    id: "rag-agent",
    value: "rag-agent",
    label: "RAG Agent",
  },
];

export default function CreateAgentPage({ onMenuClick }: CreateAgentPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [agentName, setAgentName] = useState("");
  const [agentType, setAgentType] = useState("");
  const [instructions, setInstructions] = useState("");

  const breadcrumbItems = [
    { label: "Dashboard", href: "/" },
    { label: "Create Agent", isCurrentPage: true },
  ];

  const handleFileUpload = async () => {
    const formData = new FormData();
    if (uploadedFile) {
      formData.append("file", uploadedFile);
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`File upload failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log(data);
      return data.task_id;
    } catch (error) {
      console.error("File upload error:", error);
      if (error instanceof Error) {
        throw new Error(`Error uploading file: ${error.message}`);
      }
      throw new Error("Error uploading file: Unknown error occurred");
    }
  };

  const createAgent = async () => {
    let taskId;
    
    try {
      taskId = await handleFileUpload();
    } catch (error) {
      throw error; // Re-throw the file upload error with its specific message
    }

    if (!taskId) {
      throw new Error("File upload succeeded but no task ID was returned");
    }

    const agentData = {
      task_id: taskId,
      agent_name: agentName,
      agent_type: agentType,
      document_metadata: uploadedFile
        ? {
            file_name: uploadedFile.name,
            doc_type: uploadedFile.type.split("/")[1].toUpperCase(),
            instructions: instructions.trim() || null,
          }
        : null,
      created_at: new Date().toISOString(),
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/create_agent/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(agentData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Agent creation failed (${response.status}): ${errorText}`);
      }

      const responseData = await response.json();
      
      toast({
        title: "Agent Created Successfully!",
        description: `${agentName} has been created and is ready to use.`,
      });
      
      setAgentName("");
      setAgentType("");
      setInstructions("");
      setUploadedFile(null);

      return taskId;
    } catch (error) {
      console.error("Agent creation error:", error);
      if (error instanceof Error) {
        throw new Error(`Error creating agent: ${error.message}`);
      }
      throw new Error("Error creating agent: Unknown error occurred");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setFormErrors({});

    // Validate required fields
    const errors: { [key: string]: string } = {};

    if (!agentName.trim()) {
      errors.name = "Agent name is required";
    }

    if (!agentType) {
      errors.type = "Please select an agent type";
    }

    if (!uploadedFile) {
      errors.document = "Please upload a document to train your agent";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Show error toast
      toast({
        title: "Validation Error",
        description: "Please fix the errors below before creating your agent.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const taskId = await createAgent();
      // Navigate to agents page
      router.push(`/chat/${taskId}`);
    } catch (error) {
      console.error("Failed to create agent:", error);
      
      let errorMessage = "Failed to create the agent. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = agentName.trim() && agentType && uploadedFile;

  return (
    <div className="flex-1">
      {onMenuClick && (
        <MobileBreadcrumb onMenuClick={onMenuClick} items={breadcrumbItems} />
      )}

      <div className="container mx-auto py-6 md:py-10">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="sm" className="mr-2" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-muted-foreground">
              Configure your new RAG agent with the details below
            </p>
          </div>
        </div>

        {Object.keys(formErrors).length > 0 && (
          <Alert variant="destructive" className="mx-auto mb-6 max-w-3xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please fix the following errors before creating your agent:
              <ul className="mt-2 list-disc list-inside">
                {Object.values(formErrors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Agent Details
            </CardTitle>
            <CardDescription>
              Configure your new RAG agent with the details below. All fields
              marked with * are required.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-1">
                  Agent Name
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="E.g., Customer Support Assistant"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className={cn(formErrors.name && "border-destructive")}
                  required
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name}</p>
                )}
                {agentName.trim() && !formErrors.name && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Agent name looks good</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="flex items-center gap-1">
                  Agent Type
                  <span className="text-destructive">*</span>
                </Label>
                <Select value={agentType} onValueChange={setAgentType} required>
                  <SelectTrigger
                    id="type"
                    className={cn(formErrors.type && "border-destructive")}
                  >
                    <SelectValue placeholder="Select agent type" />
                  </SelectTrigger>
                  <SelectContent>
                    {agentTypes.map((type) => (
                      <SelectItem
                        key={type.id}
                        value={type.value}
                        className={cn(
                          type.value === agentType && "bg-primary text-white"
                        )}
                      >
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.type && (
                  <p className="text-sm text-destructive">{formErrors.type}</p>
                )}
                {agentType && !formErrors.type && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Agent type selected</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Upload Document
                  <span className="text-destructive">*</span>
                </Label>
                <FileUploader
                  onFileChange={setUploadedFile}
                  error={formErrors.document}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  <span className="text-destructive font-medium">
                    Required:
                  </span>{" "}
                  Upload a document (PDF, DOCX, TXT) to train your agent (Max
                  10MB)
                </p>
                {formErrors.document && (
                  <p className="text-sm text-destructive">
                    {formErrors.document}
                  </p>
                )}
                {uploadedFile && !formErrors.document && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span>Document uploaded successfully</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">
                  Capabilities / Instructions
                </Label>
                <Textarea
                  id="instructions"
                  placeholder="Describe what your agent should do and how it should respond..."
                  className="min-h-32"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Provide detailed instructions to guide your agent's
                  behavior and responses
                </p>
              </div>

              {/* Form Progress Indicator */}
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">Form Completion</span>
                  <span className="text-sm text-muted-foreground">
                    {
                      [agentName.trim(), agentType, uploadedFile].filter(
                        Boolean
                      ).length
                    }
                    /3 required fields
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all duration-300"
                    style={{
                      width: `${
                        ([agentName.trim(), agentType, uploadedFile].filter(
                          Boolean
                        ).length /
                          3) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !isFormValid}>
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  "Create Agent"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}