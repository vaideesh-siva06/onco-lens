import { useNavigate, useParams } from "react-router";
import { useProjects } from "../../context/ProjectsContext";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaTrash } from "react-icons/fa";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useUser } from "../../context/UserContext";

interface Project {
    _id: string;
    name: string;
    description: string;
    user: string;
    adminEmail: string;
    teamEmails: string[];
    focus?: string;
    status?: string;
    cancerTypes?: string[];
}

const MembersPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { fetchProjects } = useProjects();
    const [project, setProject] = useState<Project | null>(null);
    const [email, setEmail] = useState("");
    const user = useUser();
    const navigate = useNavigate();


    useEffect(() => {
        const loadProject = async () => {
            const allProjects = await fetchProjects(); // MUST return array
            // const found = allProjects.find((p: Project) => p._id === id);
            const found = allProjects.find(p => p._id === id);

            if (found && user?.user?._id) {
                setProject({ ...found, user: user.user._id });
            }

           // setProject(found ? { ...found, user: someUserValue } : null);


        };

        loadProject();

        // console.log(project);
    }, [id]);

   const addMember = async (e: React.FormEvent) => {
        e.preventDefault();

        // console.log("Adding member:", email, id);

        if (!email) return;

        if (!project) {
            toast.error("Project not found!");
            return;
        }

        try {
            const member = await user.getUserByEmail(email);
            // console.log("Fetched member:", member);

            if (!member) {
                toast.info("Make sure user has created an account!");
                return;
            }

            if (member.email === project.adminEmail) {
                toast.error("Admin cannot be added as a member!");
                return;
            }

            if (project?.teamEmails.includes(member.email)) {
                toast.error("User is already a member!");
                return;
            }

            // Make POST request
            const response = await axios.post(
                `https://onco-lens-backend-hq5x.onrender.com/api/project/${id}/member`,
                { email },
                { withCredentials: true, headers: { "Content-Type": "application/json" } }
            );

            console.log("POST response:", response.data);

            setProject(prev =>
                prev ? { ...prev, teamEmails: [...prev.teamEmails, email] } : prev
            );

            console.log("MEMBER ADDED!");
            setEmail("");
            toast.success(`${email} added successfully`);
        } catch (error: any) {
            // console.error("Error adding member:", error);

            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    toast.error("User not found.");
                } else {
                    toast.error("Failed to add member");
                }
            } else {
                toast.error("An unexpected error occurred");
            }
        }
    };

    const handleDeleteMember = async (email: string) => {
        try {
            await axios.delete(
                `https://onco-lens-backend-hq5x.onrender.com/api/project/${id}/member`,
                {
                    data: { email, currUserId: user.user?._id },
                    withCredentials: true
                }
            );

            // ✅ Update LOCAL project state (THIS is the missing piece)
            setProject(prev =>
                prev
                    ? { ...prev, teamEmails: prev.teamEmails.filter(e => e !== email) }
                    : prev
            );
        } catch (error: any) {
            // console.error("Failed to delete member:", error);

            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    toast.error("Member not found");
                } else {
                    toast.error("Failed to delete member");
                }
            } else {
                toast.error("An unexpected error occurred");
            }
        }
    };



    if (!project) return <div>Loading members...</div>;

    return (
        <div>
            <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar
        newestOnTop
        pauseOnHover
        theme="light"
        closeButton={false}
      />
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h2 className="text-3xl font-semibold mb-6 text-gray-800">Team Members</h2>

                <ul className="space-y-3">
                    {/* Admin */}
                    <li className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div>
                            <strong className="text-gray-700">Admin:</strong>
                            <span className="ml-2 text-gray-600">{project.adminEmail}</span>
                        </div>
                    </li>

                    {/* Team Members */}
                    {project.teamEmails.length > 0 ? (
                        project.teamEmails.map((email) => (
                            <li
                                key={email}
                                className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                            >
                                <span className="text-gray-700">{email}</span>

                                {user.user?.email == project.adminEmail || user.user?.email === email ? <button
                                    className="text-red-500 hover:text-red-700 transition"
                                    onClick={async () => {
                                        await handleDeleteMember(email)

                                        if (email == user.user?.email)
                                        {
                                            navigate('/');
                                            toast.success("Left project successfully!");
                                        }
                                        else
                                        {
                                            toast.success("Member removed successfully!");
                                        }

                                    }
                                        
                                    }
                                >
                                    <FaTrash size={16} />
                                </button> : null}
                            </li>
                        ))
                    ) : (
                        <li className="text-gray-500 italic">No team members added yet.</li>
                    )}
                </ul>
            </div>

            <form onSubmit={addMember} className="mt-4">
                <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                    className="border border-gray-300 rounded px-2 py-1 h-10 w-60"
                />

                <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded ml-2"
                >
                    Add Member
                </button>
            </form>
        </div>
    );
};

export default MembersPage;
