import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { HomePage } from '@/pages/HomePage'
import { QuestPage } from '@/pages/QuestPage'
import { TalkPage } from '@/pages/TalkPage'
import { ResultPage } from '@/pages/ResultPage'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <main className="mx-auto min-h-screen max-w-md px-4 pb-10 pt-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quest/:id" element={<QuestPage />} />
          <Route path="/talk/:id" element={<TalkPage />} />
          <Route path="/result/:sessionId" element={<ResultPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toaster />
    </BrowserRouter>
  )
}
