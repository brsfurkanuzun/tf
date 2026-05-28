import { ScrollScene } from './components/scene/ScrollScene'
import { QuoteSection } from './components/ui/QuoteSection'

export const App = function App() {
  return (
    <main className="relative min-h-screen w-full bg-white">
      <ScrollScene />
      <QuoteSection />
    </main>
  )
}
