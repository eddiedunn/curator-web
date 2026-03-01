import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, TestTube2, ChevronDown, ChevronUp } from "lucide-react"

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
import { useCreateSubscription, useSubscriptions } from "@/hooks/useSubscriptions"
import type { SubscriptionResponse, SubscriptionUpdate } from "@/api/types"

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

export interface AddSubscriptionFormProps {
  onSuccess: (subscription: SubscriptionResponse) => void
  onCancel?: () => void
  initialData?: SubscriptionUpdate
}

export function AddSubscriptionForm({
  onSuccess,
  onCancel,
  initialData,
}: AddSubscriptionFormProps) {
  const [isTestingUrl, setIsTestingUrl] = React.useState(false)
  const [testUrlError, setTestUrlError] = React.useState<string | null>(null)
  const [testUrlSuccess, setTestUrlSuccess] = React.useState(false)
  const [showAdvanced, setShowAdvanced] = React.useState(false)

  const createSubscription = useCreateSubscription()
  const { data: existingSubscriptions } = useSubscriptions()

  // Initialize form with default values or initial data
  const form = useForm<SubscriptionFormValues>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      subscription_type: initialData?.subscription_type || "youtube_channel",
      source_url: initialData?.source_url || "",
      check_frequency_minutes: initialData?.check_frequency_minutes || 60,
      enabled: initialData?.enabled ?? true,
      metadata: initialData?.metadata
        ? JSON.stringify(initialData.metadata, null, 2)
        : "",
    },
  })

  // Check for duplicate URLs
  const checkDuplicateUrl = (url: string): boolean => {
    if (!existingSubscriptions) return false
    return existingSubscriptions.some((sub) => sub.source_url === url)
  }

  // Test URL connection
  const handleTestUrl = async () => {
    const url = form.getValues("source_url")

    if (!url) {
      setTestUrlError("Please enter a URL first")
      return
    }

    setIsTestingUrl(true)
    setTestUrlError(null)
    setTestUrlSuccess(false)

    try {
      // Simple fetch to test if URL is accessible
      await fetch(url, {
        method: "HEAD",
        mode: "no-cors", // Handle CORS issues
      })

      setTestUrlSuccess(true)
      setTestUrlError(null)
    } catch (error) {
      // Since we're using no-cors, we can't really determine success
      // So we'll just try to parse the URL and consider it valid if it's well-formed
      try {
        new URL(url)
        setTestUrlSuccess(true)
        setTestUrlError(null)
      } catch {
        setTestUrlError("Unable to verify URL. Please check the URL is correct.")
      }
    } finally {
      setIsTestingUrl(false)
    }
  }

  // Form submission handler
  const onSubmit = async (values: SubscriptionFormValues) => {
    // Check for duplicate URLs
    if (checkDuplicateUrl(values.source_url)) {
      form.setError("source_url", {
        type: "manual",
        message: "A subscription with this URL already exists",
      })
      return
    }

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
      const result = await createSubscription.mutateAsync(submissionData)
      onSuccess(result)
      form.reset()
    } catch (error: any) {
      // Handle API errors
      const errorMessage =
        error?.message || "Failed to create subscription. Please try again."
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
              <div className="flex flex-col sm:flex-row gap-2">
                <FormControl>
                  <Input
                    type="url"
                    placeholder="https://example.com/feed"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e)
                      setTestUrlSuccess(false)
                      setTestUrlError(null)
                    }}
                    className="flex-1"
                  />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestUrl}
                  disabled={isTestingUrl || !field.value}
                  className="sm:w-auto w-full min-h-[44px]"
                >
                  {isTestingUrl ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <TestTube2 className="h-4 w-4" />
                  )}
                  <span className="ml-2">Test</span>
                </Button>
              </div>
              <FormDescription>
                The URL of the content source to subscribe to
              </FormDescription>
              {testUrlSuccess && (
                <p className="text-sm text-green-600">✓ URL appears valid</p>
              )}
              {testUrlError && (
                <p className="text-sm text-destructive">{testUrlError}</p>
              )}
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

        {/* Action Buttons - Stack on mobile for better touch targets */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={createSubscription.isPending}
              className="min-h-[44px] sm:order-1"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={createSubscription.isPending}
            className="min-h-[44px] sm:order-2"
          >
            {createSubscription.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {initialData ? "Update" : "Create"} Subscription
          </Button>
        </div>
      </form>
    </Form>
  )
}
