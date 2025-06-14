import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AgentCard } from "@/components/agent-card"
import { MobileBreadcrumb } from "@/components/mobile-breadcrumb"
import { Bot, Plus, Search } from "lucide-react"

// Sample agent data - in real app, this would come from your API/database


// Simulate API delay for demonstration
async function getAgents() {
  // In a real app, this would be your actual API call
  // await new Promise(resolve => setTimeout(resolve, 2000))
  // return agents
try{
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/get_all_agents/`, {
    headers: {
      'accept': 'application/json',
    },
  });
  const data = await response.json();

  return data.agents
}catch(e){
  console.log(e)
  throw new Error('Error fetching agents')
}
  
}

interface AgentsListPageProps {
  onMenuClick?: () => void
}

export default async function AgentsListPage({ onMenuClick }: AgentsListPageProps) {
  // Fetch agents data (this will trigger the loading.tsx while waiting)
  const agentsData = await getAgents()

  const breadcrumbItems = [
    { label: "Dashboard", href: "/" },
    { label: "Agents", isCurrentPage: true },
  ]

  return (
    <div className="flex-1">
      {onMenuClick && <MobileBreadcrumb onMenuClick={onMenuClick} items={breadcrumbItems} />}

      <div className="container mx-auto py-6 md:py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {/* <h1 className="text-3xl font-bold">Agents</h1> */}
            <p className="text-muted-foreground">Manage and interact with your RAG agents</p>
          </div>
          <Button asChild>
            <Link href="/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Agent
            </Link>
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="p-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search agents..." className="pl-8" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-full">
                All Agents
              </Button>
              <Button variant="outline" size="sm" className="rounded-full">
                Recently Created
              </Button>
              <Button variant="outline" size="sm" className="rounded-full">
                PDF Documents
              </Button>
              <Button variant="outline" size="sm" className="rounded-full">
                DOCX Documents
              </Button>
            </div>
          </CardContent>
        </Card>

        {agentsData.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-10 text-center">
            <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-xl font-semibold">No agents found</h3>
            <p className="mb-4 text-muted-foreground">
              You haven't created any agents yet. Create your first agent to get started.
            </p>
            <Button asChild>
              <Link href="/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Agent
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agentsData.map((agent:any) => (
              <AgentCard key={agent.task_id} agent={agent} />
            ))}
          </div>
        )}

        {agentsData.length > 0 && (
          <CardFooter className="mt-6 justify-center border-t p-4">
            <Button variant="outline" size="sm">
              Load More
            </Button>
          </CardFooter>
        )}
      </div>
    </div>
  )
}
