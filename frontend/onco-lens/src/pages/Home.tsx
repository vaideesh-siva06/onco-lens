import React, { useEffect } from 'react';
import './Home.css'; // Background styles
import FeaturesSection from '../components/FeaturesSection';
import HeroSection from '../components/HeroSection';
import ProblemSolutionSection from '../components/ProblemSolutionSection';


const Home: React.FC = () => {
    useEffect(() => {
        document.title = "OncoLens";
    }, []);

    return (
        <div>
            {/* Hero Section */}
            <HeroSection />

            {/* Features Section */}
            <FeaturesSection />

            <ProblemSolutionSection />
        </div>
    );
};

export default Home;
