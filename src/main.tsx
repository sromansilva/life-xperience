import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import App from "./app/App"
import { PrefsProvider } from './app/providers/PrefsProvider'
import { OrionProvider } from './app/providers/OrionProvider'
import { SessionProvider } from './app/providers/SessionProvider'
import { ProgressProvider } from './app/providers/ProgressProvider'
import './styles/index.css'

const router = createBrowserRouter([{ path: '*', element: <App /> }])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SessionProvider><ProgressProvider><PrefsProvider><OrionProvider><RouterProvider router={router} /></OrionProvider></PrefsProvider></ProgressProvider></SessionProvider>
  </React.StrictMode>,
)
