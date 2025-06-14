"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex-1">
      <div className="container mx-auto py-6 md:py-10">
        <Card className="flex flex-col items-center justify-center p-10 text-center">
          <AlertTriangle className="mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-xl font-semibold">Something went wrong!</h2>
          <p className="mb-4 text-muted-foreground">
            Failed to load agents. Please try again or contact support if the problem persists.
          </p>
          <div className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
