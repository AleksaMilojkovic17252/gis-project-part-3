import { MapView } from './components/MapView'
import { Sidebar } from './components/Sidebar'
import { Legend } from './components/Legend'

export default function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapView />
      <Sidebar />
      <Legend />
    </div>
  )
}
