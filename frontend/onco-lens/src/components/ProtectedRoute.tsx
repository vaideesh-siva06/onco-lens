// ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, userId, loading } = useAuth();

    if (loading) return <div>Loading...</div>;

    if (!isAuthenticated || !userId) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
