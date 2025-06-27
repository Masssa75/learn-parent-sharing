import TelegramLogin from '@/components/TelegramLogin'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to Learn</h1>
          <p className="text-gray-400 text-lg">
            Discover and share the best apps, toys, and tips for your kids
          </p>
        </div>
        
        <div className="bg-dark-surface rounded-2xl p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white">Get Started</h2>
            <p className="text-gray-400">
              Sign in with your Telegram account to join our community of parents
            </p>
          </div>
          
          <div className="flex justify-center">
            <TelegramLogin />
          </div>
          
          <div className="text-sm text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
        
        <div className="space-y-4 text-gray-400">
          <h3 className="font-semibold text-white">Why Telegram?</h3>
          <ul className="space-y-2 text-sm">
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