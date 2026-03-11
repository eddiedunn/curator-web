import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { AddSubscriptionForm } from "@/components/forms/AddSubscriptionForm"

export function NewSubscriptionPage() {
  const navigate = useNavigate()

  return (
    <div className="max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/subscriptions">Subscriptions</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New Subscription</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/subscriptions">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">New Subscription</h1>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Subscription</CardTitle>
          <CardDescription>
            Create a new subscription to automatically track and ingest content from your favorite sources.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddSubscriptionForm
            onSuccess={(subscription) => navigate(`/subscriptions/${subscription.id}`)}
            onCancel={() => navigate("/subscriptions")}
          />
        </CardContent>
      </Card>
    </div>
  )
}
