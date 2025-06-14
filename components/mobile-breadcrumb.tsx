"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface MobileBreadcrumbProps {
  onMenuClick: () => void
  items: Array<{
    label: string
    href?: string
    isCurrentPage?: boolean
  }>
}

export function MobileBreadcrumb({ onMenuClick, items }: MobileBreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 border-b bg-background px-4 py-3 md:hidden">
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onMenuClick}>
        <Menu className="h-4 w-4" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {item.isCurrentPage ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href || "#"}>{item.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
