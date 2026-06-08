// src/components/Sidebar.tsx
import { useState } from 'react'

import { Filter, MapPin, Route } from 'lucide-react'

import { useMapStore } from '../store/useMapStore'
import { FilterPanel } from './FilterPanel'
import { SpatialPanel } from './SpatialPanel'
import { VehiclePanel } from './VehiclePanel'

const tabs = [
  { id: 'filter',  label: 'Filter',  icon: Filter },
  { id: 'spatial', label: 'Spatial', icon: MapPin },
  { id: 'vehicle', label: 'Vehicle', icon: Route },
]

export const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('filter')
  const queryResult = useMapStore((s) => s.queryResult)

  return (
    <div className="absolute top-3 left-3 z-[1000] bg-white rounded-lg shadow-lg w-80 max-h-[90vh] overflow-hidden flex flex-col">
      <div className="flex border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors
                ${activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="p-4 overflow-y-auto">
        {activeTab === 'filter'  && <FilterPanel />}
        {activeTab === 'spatial' && <SpatialPanel />}
        {activeTab === 'vehicle' && <VehiclePanel />}
      </div>

      {queryResult && (
        <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-600">
            {queryResult.label && <span className="font-medium">{queryResult.label}: </span>}
            <span className="font-semibold text-emerald-600">{queryResult.total}</span> features
          </p>
        </div>
      )}
    </div>
  )
}
