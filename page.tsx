import FeedComponent from '../components/FeedComponent'
import { ErrorBoundary } from '../components/ErrorBoundary'

export default function AppPage() {
  return (
    <ErrorBoundary>
      <FeedComponent showAuthPrompt={true} protectedRoute={false} />
    </ErrorBoundary>
  )
}