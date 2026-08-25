import React from 'react'
import ReactDOMServer from 'react-dom/server'
import SafetyIntelligenceView from '../frontend/src/components/SafetyIntelligenceView.jsx'

try {
  const html = ReactDOMServer.renderToString(React.createElement(SafetyIntelligenceView, { onNavigateTab: () => {} }))
  console.log('RENDER SUCCESS! HTML length:', html.length)
} catch (e) {
  console.error('RENDER ERROR CRASH:', e)
}
