// Example API functions for your agents
// You can replace these with your actual API calls

export interface Agent {
  id: string
  name: string
  documentName: string
  documentType: string
  createdAt: string
}

// Simulate API delay for demonstration
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchAgents(): Promise<Agent[]> {
  // Simulate network delay
  await delay(2000)

  // In a real app, this would be your actual API call
  // const response = await fetch('/api/agents')
  // return response.json()

  return [
    {
      id: "1",
      name: "Customer Support Agent",
      documentName: "Support Guidelines.pdf",
      documentType: "PDF",
      createdAt: "2023-06-10T12:00:00Z",
    },
    {
      id: "2",
      name: "Product FAQ Bot",
      documentName: "Product Manual.docx",
      documentType: "DOCX",
      createdAt: "2023-06-08T09:30:00Z",
    },
    {
      id: "3",
      name: "HR Policy Assistant",
      documentName: "HR Policies.pdf",
      documentType: "PDF",
      createdAt: "2023-06-05T14:15:00Z",
    },
    {
      id: "4",
      name: "Technical Support",
      documentName: "Troubleshooting Guide.txt",
      documentType: "TXT",
      createdAt: "2023-06-01T11:45:00Z",
    },
    {
      id: "5",
      name: "Sales Assistant",
      documentName: "Sales Playbook.pdf",
      documentType: "PDF",
      createdAt: "2023-05-28T16:20:00Z",
    },
    {
      id: "6",
      name: "Onboarding Guide",
      documentName: "New Employee Guide.docx",
      documentType: "DOCX",
      createdAt: "2023-05-25T10:10:00Z",
    },
  ]
}

export async function createAgent(agentData: Omit<Agent, "id" | "createdAt">): Promise<Agent> {
  // Simulate API delay
  await delay(1500)

  // In a real app, this would be your actual API call
  // const response = await fetch('/api/agents', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(agentData)
  // })
  // return response.json()

  return {
    ...agentData,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  }
}

export async function deleteAgent(agentId: string): Promise<void> {
  // Simulate API delay
  await delay(1000)

  // In a real app, this would be your actual API call
  // await fetch(`/api/agents/${agentId}`, { method: 'DELETE' })
}
