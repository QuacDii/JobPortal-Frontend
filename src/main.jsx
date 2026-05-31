import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

createRoot(document.getElementById('root')).render(
<GoogleOAuthProvider clientId="848848650996-simt9pfg6c2gms9voobfhflg0i12aloe.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
)
