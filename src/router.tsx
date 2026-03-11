import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './components/Layout'
import { DashboardPage } from './pages/DashboardPage'
import { SubscriptionsPage } from './pages/SubscriptionsPage'
import { SubscriptionDetailPage } from './pages/SubscriptionDetailPage'
import { EditSubscriptionPage } from './pages/EditSubscriptionPage'
import { NewSubscriptionPage } from './pages/NewSubscriptionPage'
import { IngestedPage } from './pages/IngestedPage'
import { ManualIngestPage } from './pages/ManualIngestPage'
import { SettingsPage } from './pages/SettingsPage'
import { NotFoundPage } from './pages/NotFoundPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'subscriptions',
        element: <SubscriptionsPage />,
      },
      {
        path: 'subscriptions/new',
        element: <NewSubscriptionPage />,
      },
      {
        path: 'subscriptions/:id',
        element: <SubscriptionDetailPage />,
      },
      {
        path: 'subscriptions/:id/edit',
        element: <EditSubscriptionPage />,
      },
      {
        path: 'ingested',
        element: <IngestedPage />,
      },
      {
        path: 'manual',
        element: <ManualIngestPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
