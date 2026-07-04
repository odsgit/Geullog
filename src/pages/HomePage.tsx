import { AppHeader } from '@/components/AppHeader'
import { GenerationForm } from '@/components/GenerationForm'

export function HomePage() {
  return (
    <div className="min-h-svh bg-paper">
      <AppHeader />

      <main className="px-6 py-12">
        <GenerationForm />
      </main>
    </div>
  )
}
