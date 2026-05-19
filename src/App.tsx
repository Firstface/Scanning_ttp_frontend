import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { CreateTaskPage } from './pages/CreateTaskPage'
import { LoginPage } from './pages/LoginPage'
import { RecordsPage } from './pages/RecordsPage'
import { TaskDetailPage } from './pages/TaskDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/records" replace />} />
          <Route path="/create" element={<CreateTaskPage />} />
          <Route path="/records" element={<RecordsPage />} />
          <Route path="/tasks" element={<RecordsPage />} />
          <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/records" replace />} />
    </Routes>
  )
}

export default App
