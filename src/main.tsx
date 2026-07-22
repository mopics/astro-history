import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgContainer: 'hsl(var(--card))',
          colorBgElevated: 'hsl(var(--popover))',
          colorBorder: 'hsl(var(--border))',
          colorText: 'hsl(var(--foreground))',
          colorPrimary: 'hsl(var(--primary))',
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
