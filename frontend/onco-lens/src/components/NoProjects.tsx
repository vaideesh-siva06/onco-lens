import { FaProjectDiagram } from 'react-icons/fa';

interface NoProjectsProps {
    onCreate: () => void;
}

const NoProjects: React.FC<NoProjectsProps> = ({ onCreate }) => {
    return (
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-orange-300 rounded-lg bg-orange-50 mt-6 text-center">
            <FaProjectDiagram className="text-orange-500 text-5xl mb-4" />
            <h3 className="text-xl font-bold text-orange-600 mb-2">No Projects Yet</h3>
            <p className="text-orange-500 mb-4">
                You don’t have any projects. Start by creating a new one!
            </p>
            <button
                onClick={onCreate}
                className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition"
            >
                Create Project
            </button>
        </div>
    );
};

export default NoProjects;
