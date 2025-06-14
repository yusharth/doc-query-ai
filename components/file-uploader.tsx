"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  X,
  File,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onFileChange?: (file: File | null) => void;
  error?: string;
  required?: boolean;
}

export function FileUploader({
  onFileChange,
  error,
  required = false,
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onFileChange?.(file);
  }, [file, onFileChange]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const validateFile = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [".pdf", ".docx", ".doc", ".txt"];
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

    if (file.size > maxSize) {
      alert("File size must be less than 10MB");
      return false;
    }

    if (!allowedTypes.includes(fileExtension)) {
      alert("Only PDF, DOCX, and TXT files are allowed");
      return false;
    }

    return true;
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = () => {
    if (!file) return <FileText className="h-10 w-10 text-muted-foreground" />;

    const extension = file.name.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "pdf":
        return <FileText className="h-10 w-10 text-red-500" />;
      case "docx":
      case "doc":
        return <FileText className="h-10 w-10 text-blue-500" />;
      case "txt":
        return <FileText className="h-10 w-10 text-gray-500" />;
      default:
        return <File className="h-10 w-10 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-2">
      {!file ? (
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border border-dashed p-6 transition-colors cursor-pointer",
            isDragging && "border-primary bg-primary/5",
            error && "border-destructive bg-destructive/5",
            !error &&
              !isDragging &&
              "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/25"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowseClick}
        >
          {error ? (
            <AlertCircle className="mb-2 h-10 w-10 text-destructive" />
          ) : (
            <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
          )}
          <p
            className={cn(
              "mb-1 text-sm font-medium",
              error && "text-destructive"
            )}
          >
            {error
              ? "Document upload required"
              : "Drag and drop your document here or click to browse"}
            {required && <span className="ml-1 text-destructive">*</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, DOCX, or TXT up to 10MB
          </p>
          <Button
            variant={error ? "destructive" : "outline"}
            size="sm"
            className="mt-4"
            type="button"
          >
            {error ? "Upload Required Document" : "Browse Files"}
          </Button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileChange}
            required={required}
          />
        </div>
      ) : (
        <div
          className={cn(
            "flex items-center justify-between rounded-lg border p-4",
            error
              ? "border-destructive bg-destructive/5"
              : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20"
          )}
        >
          <div className="flex items-center space-x-4">
            {getFileIcon()}
            <div>
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <Button
              variant="ghost"
              size="sm"
              onClick={removeFile}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove file</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
