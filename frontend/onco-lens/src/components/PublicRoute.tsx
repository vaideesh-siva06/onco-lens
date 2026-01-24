// PublicRoute.tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface PublicRouteProps {
    children: ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const { isAuthenticated, userId, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (isAuthenticated && userId) {
        return <Navigate to={`/${userId}/dashboard`} replace />;
    }

    return <>{children}</>;
};

export default PublicRoute;
