import { useAuth } from './context/AuthContext'
import { ApiKeySetupPage } from './components/auth/ApiKeySetupPage'
import { AuthPage } from './components/auth/AuthPage'
import { MainApp } from './MainApp'

export default function App() {
  const { user, loading, login, register, refreshAppData } = useAuth()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-wa-bg text-ink-muted">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <AuthPage onLogin={login} onRegister={register} />
  }

  if (!user.hasLlmKey && !user.llmSetupSkipped) {
    return (
      <ApiKeySetupPage
        onComplete={async () => {
          await refreshAppData()
        }}
        onSkip={async () => {
          await refreshAppData()
        }}
      />
    )
  }

  return <MainApp />
}
