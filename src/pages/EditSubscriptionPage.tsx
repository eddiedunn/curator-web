import { useParams, Link, useNavigate } from "react-router-dom"
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
import { EditSubscriptionForm } from "@/components/forms/EditSubscriptionForm"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { ErrorMessage } from "@/components/ErrorMessage"
import { useSubscription } from "@/hooks/useSubscriptions"

export function EditSubscriptionPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: subscription, isLoading, error, refetch } = useSubscription(id!)

  if (isLoading) return <LoadingSkeleton variant="form" count={1} />
  if (error) {
    return (
      <ErrorMessage
        title="Failed to load subscription"
        message="Unable to fetch subscription details."
        error={error}
        onRetry={() => refetch()}
      />
    )
  }
  if (!subscription) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-foreground">Subscription not found</h2>
        <Link to="/subscriptions" className="text-primary hover:underline mt-2 inline-block">
          Back to subscriptions
        </Link>
      </div>
    )
  }

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
            <BreadcrumbLink asChild>
              <Link to={`/subscriptions/${subscription.id}`}>{subscription.name}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to={`/subscriptions/${subscription.id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Edit Subscription</h1>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Edit &quot;{subscription.name}&quot;</CardTitle>
          <CardDescription>Update subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <EditSubscriptionForm
            subscription={subscription}
            onSuccess={() => navigate(`/subscriptions/${subscription.id}`)}
            onCancel={() => navigate(`/subscriptions/${subscription.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
