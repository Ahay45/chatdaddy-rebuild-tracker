import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import RoadmapPresentation from './RoadmapPresentation'
import './roadmap.css'

createRoot(document.getElementById('roadmap-root')!).render(
  <StrictMode>
    <RoadmapPresentation />
  </StrictMode>
)
