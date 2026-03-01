import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useUpdateSubscription } from "@/hooks/useSubscriptions"
import type { SubscriptionResponse } from "@/api/types"

// Zod schema for form validation
const subscriptionFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  subscription_type: z.enum(["youtube_channel", "rss_feed", "podcast"], "Please select a subscription type"),
  source_url: z
    .string()
    .min(1, "URL is required")
    .url("Please enter a valid URL"),
  check_frequency_minutes: z.number().min(15).max(1440),
  enabled: z.boolean(),
  metadata: z
    .string()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true
        try {
          JSON.parse(val)
          return true
        } catch {
          return false
        }
      },
      "Must be valid JSON"
    ),
})

type SubscriptionFormValues = z.infer<typeof subscriptionFormSchema>

export interface EditSubscriptionFormProps {
  subscription: SubscriptionResponse
  onSuccess: (subscription: SubscriptionResponse) => void
  onCancel?: () => void
}

export function EditSubscriptionForm({
  subscription,
  onSuccess,
  onCancel,
}: EditSubscriptionFormProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false)

  const updateSubscription = useUpdateSubscription()

  // Initialize form with subscription data
  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      name: subscription.name,
      subscription_type: subscription.subscription_type,
      source_url: subscription.source_url,
      check_frequency_minutes: subscription.check_frequency_minutes,
      enabled: subscription.enabled,
      metadata: subscription.metadata
        ? JSON.stringify(subscription.metadata, null, 2)
        : "",
    },
  })

  // Form submission handler
  const onSubmit = async (values: SubscriptionFormValues) => {
    // Parse metadata if provided
    let metadata: Record<string, any> | undefined
    if (values.metadata && values.metadata.trim() !== "") {
      try {
        metadata = JSON.parse(values.metadata)
      } catch (error) {
        form.setError("metadata", {
          type: "manual",
          message: "Invalid JSON format",
        })
        return
      }
    }

    // Prepare submission data
    const submissionData = {
      name: values.name,
      subscription_type: values.subscription_type,
      source_url: values.source_url,
      check_frequency_minutes: values.check_frequency_minutes,
      enabled: values.enabled,
      metadata,
    }

    try {
      const result = await updateSubscription.mutateAsync({
        id: subscription.id,
        data: submissionData,
      })
      onSuccess(result)
    } catch (error: any) {
      // Handle API errors
      const errorMessage =
        error?.message || "Failed to update subscription. Please try again."
      form.setError("root", {
        type: "manual",
        message: errorMessage,
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="My Subscription" {...field} />
              </FormControl>
              <FormDescription>
                A friendly name for this subscription
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Type Field (Radio Group) */}
        <FormField
          control={form.control}
          name="subscription_type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Type *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="youtube_channel" id="youtube" />
                    <Label htmlFor="youtube" className="font-normal cursor-pointer">
                      YouTube Channel
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="rss_feed" id="rss" />
                    <Label htmlFor="rss" className="font-normal cursor-pointer">
                      RSS Feed
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="podcast" id="podcast" />
                    <Label htmlFor="podcast" className="font-normal cursor-pointer">
                      Podcast
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* URL Field */}
        <FormField
          control={form.control}
          name="source_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL *</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://example.com/feed"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The URL of the content source to subscribe to
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Check Frequency Slider */}
        <FormField
          control={form.control}
          name="check_frequency_minutes"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel>Check Frequency</FormLabel>
                <span className="text-sm text-muted-foreground">
                  {field.value} minutes
                </span>
              </div>
              <FormControl>
                <Slider
                  min={15}
                  max={1440}
                  step={15}
                  value={[field.value]}
                  onValueChange={(vals) => field.onChange(vals[0])}
                  className="w-full"
                />
              </FormControl>
              <FormDescription>
                How often to check for new content (15 min - 24 hours)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Enabled Checkbox */}
        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Enabled</FormLabel>
                <FormDescription>
                  Start checking for new content immediately
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Advanced Options - Collapsible Metadata */}
        <div className="border rounded-lg p-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full text-sm font-medium"
          >
            <span>Advanced Options</span>
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showAdvanced && (
            <div className="mt-4">
              <FormField
                control={form.control}
                name="metadata"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metadata (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='{"key": "value"}'
                        className="font-mono text-sm"
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional metadata in JSON format
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Root Error Message */}
        {form.formState.errors.root && (
          <div className="text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={updateSubscription.isPending}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={updateSubscription.isPending}
          >
            {updateSubscription.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update Subscription
          </Button>
        </div>
      </form>
    </Form>
  )
}
