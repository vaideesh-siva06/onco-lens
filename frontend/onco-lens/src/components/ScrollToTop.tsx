import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0); // instantly scroll to top on every route change
    }, [pathname]);

    return null;
};

export default ScrollToTop;
