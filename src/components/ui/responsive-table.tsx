import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronRight } from "lucide-react"

interface ResponsiveTableProps {
  data: any[]
  columns: {
    key: string
    label: string
    hideOnMobile?: boolean
    render?: (value: any, row: any) => React.ReactNode
    className?: string
  }[]
  className?: string
  mobileCardRender?: (row: any, index: number) => React.ReactNode
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  data,
  columns,
  className,
  mobileCardRender
}) => {
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(new Set())

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  // Desktop table view
  const desktopTable = (
    <div className="hidden md:block w-full overflow-x-auto rounded-md border border-border">
      <table className={cn("w-full caption-bottom text-sm", className)}>
        <thead className="[&_tr]:border-b bg-muted/50 sticky top-0 z-10">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap",
                  column.hideOnMobile && "hidden lg:table-cell",
                  column.className
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {data.map((row, index) => (
            <tr
              key={index}
              className="border-b transition-colors hover:bg-muted/50"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "p-4 align-middle text-sm",
                    column.hideOnMobile && "hidden lg:table-cell",
                    column.className
                  )}
                >
                  {column.render 
                    ? column.render(row[column.key], row)
                    : row[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  // Mobile card view
  const mobileCards = (
    <div className="block md:hidden space-y-4">
      {data.map((row, index) => {
        const isExpanded = expandedRows.has(index)
        
        if (mobileCardRender) {
          return mobileCardRender(row, index)
        }

        return (
          <div
            key={index}
            className="border border-border rounded-lg p-4 bg-card"
          >
            <div className="flex justify-between items-start mb-3">
              {/* Show primary columns */}
              <div className="flex-1 space-y-2">
                {columns.slice(0, 2).map((column) => (
                  <div key={column.key} className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      {column.label}:
                    </span>
                    <span className="text-sm">
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Expand button if there are hidden columns */}
              {columns.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleRow(index)}
                  className="h-8 w-8 p-0 ml-2"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {/* Expanded content */}
            {isExpanded && columns.length > 2 && (
              <div className="space-y-2 pt-2 border-t border-border">
                {columns.slice(2).map((column) => (
                  <div key={column.key} className="flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      {column.label}:
                    </span>
                    <span className="text-sm">
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="w-full">
      {desktopTable}
      {mobileCards}
    </div>
  )
}