import TelegramLogin from '@/components/TelegramLogin'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-display text-text-primary mb-3">Welcome to Learn</h1>
          <p className="text-text-secondary text-body-lg">
            Discover and share the best apps, toys, and tips for your kids
          </p>
        </div>
        
        <div className="bg-dark-surface rounded-card p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-title text-text-primary">Get Started</h2>
            <p className="text-text-secondary text-body">
              Sign in with your Telegram account to join our community of parents
            </p>
          </div>
          
          <div className="flex justify-center">
            <TelegramLogin />
          </div>
          
          <div className="text-meta text-text-muted">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
        
        <div className="space-y-4 text-text-secondary">
          <h3 className="font-semibold text-text-primary text-body-lg">Why Telegram?</h3>
          <ul className="space-y-2 text-body">
            <li>✓ No passwords to remember</li>
            <li>✓ Instant notifications for new discoveries</li>
            <li>✓ Secure and private</li>
            <li>✓ Easy one-click login</li>
          </ul>
        </div>
      </div>
    </main>
  )
}