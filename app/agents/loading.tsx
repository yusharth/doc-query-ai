import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex-1">
      {/* Mobile breadcrumb skeleton */}
      <div className="flex items-center gap-2 border-b bg-background px-4 py-3 md:hidden">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="container mx-auto py-6 md:py-10">
        {/* Header skeleton */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>

        {/* Search and filters skeleton */}
        <Card className="mb-6">
          <CardHeader className="p-4">
            <Skeleton className="h-10 w-full" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
              <Skeleton className="h-8 w-36 rounded-full" />
            </div>
          </CardContent>
        </Card>

        {/* Agent cards skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="border-b bg-muted/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                </div>
              </CardContent>
              <CardFooter className="border-t p-4">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Loading indicator */}
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span className="text-sm text-muted-foreground">Loading agents...</span>
          </div>
        </div>

        {/* Load more skeleton */}
        <CardFooter className="mt-6 justify-center border-t p-4">
          <Skeleton className="h-8 w-20" />
        </CardFooter>
      </div>
    </div>
  )
}
