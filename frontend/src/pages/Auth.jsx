import AuthOverlay from '../components/auth/AuthOverlay'

function Auth() {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center p-4">
      <AuthOverlay isStandalone />
    </div>
  )
}

export default Auth
