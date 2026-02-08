import { useUser } from '../../context/UserContext';
import { useProjects } from '../../context/ProjectsContext';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'react-toastify';
import axios from 'axios';

const ProjectSettingsPage = () => {
  const { user } = useUser();
  const { id } = useParams<{ id: string }>();
  const { projects, deleteProject, setProjects } = useProjects();
  const navigate = useNavigate();

  const project = projects?.[0];

  if (!project || !user) {
    return <div>Loading...</div>;
  }

  const isAdmin = project.adminEmail === user.email;

  // console.log("Is Admin:", isAdmin);

  const handleDeleteMember = async (email: string) => {
        try {

            await axios.delete(
                `https://onco-lens-backend.onrender.com/api/project/${id}/member`,
                {
                    data: { email, currUserId: user?._id },
                    withCredentials: true
                }
            );

            // ✅ Update global projects state
            await setProjects(prev => prev.filter(p => p._id !== id));

            toast.success("Successfully left project!");
        } catch (error: any) {
            // console.error("Failed to delete member:", error);

            setProjects(prev => prev.filter(p => p._id !== id));

            if (error.response?.status === 400) {
            toast.error("Member not found");
            } else {
            toast.error("Failed to delete member");
            }
        }
    };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Settings</h1>

      {isAdmin ? (
        <button
          className="bg-red-500 text-white px-4 py-2 rounded-lg"
          onClick={async () => {
            try {
              await deleteProject(project._id);

              // Remove from local state
              setProjects(prev => prev.filter(p => p._id !== project._id));

              // Navigate home
              navigate("/");
            } catch (err) {
              // console.error("Failed to delete project:", err);
              toast.error("Could not delete project. Try again.");
            }
          }}
        >
          Delete Project
        </button>
      ) : (
        <button
          className="bg-red-500 text-white px-4 py-2 rounded-lg"
          onClick={async () => {
            try {
               await handleDeleteMember(user.email)
                navigate('/');
            } catch (err) {
              // console.error("Failed to leave project:", err);
              toast.error("Could not leave project. Try again.");
            }
          }}
        >
          Leave Project
        </button>
      )}
    </div>
  );
};

export default ProjectSettingsPage;
