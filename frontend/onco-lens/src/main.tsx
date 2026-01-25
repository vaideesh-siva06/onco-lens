import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.tsx';
import { UserProvider } from '../context/UserContext.tsx';
import { ModalProvider } from '../context/ModalContext.tsx';
import { ProjectsProvider } from '../context/ProjectsContext.tsx';

(window as any).global = window;

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <UserProvider>
      <ModalProvider>
        <BrowserRouter>
          <ProjectsProvider>
            <App />
          </ProjectsProvider>
        </BrowserRouter>
      </ModalProvider>
    </UserProvider>
  </AuthProvider>
)
