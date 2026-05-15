import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { CreateTaskPage } from './pages/CreateTaskPage'
import { RecordsPage } from './pages/RecordsPage'
import { TaskDetailPage } from './pages/TaskDetailPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/records" replace />} />
        <Route path="/create" element={<CreateTaskPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="/tasks" element={<RecordsPage />} />
        <Route path="/tasks/:taskId" element={<TaskDetailPage />} />
      </Route>
    </Routes>
  )
}

export default App
