import React, { useEffect, useRef, useState } from "react";
import { FaVideo, FaLink, FaPlay, FaUserPlus, FaTrash, FaSignOutAlt, FaSign } from "react-icons/fa";
import CreateMeetingModal from "../components/CreateMeetingModal";
import { useProjects } from "../../context/ProjectsContext";
import { useUser } from "../../context/UserContext";
import axios from "axios";
import { toast } from "react-toastify";

const MeetingPage: React.FC = () => {
    const [open, setOpen] = useState(false);
    const { user } = useUser();
    const { meetings, fetchMeetings, createMeeting, addParticipantToMeeting, deleteParticipantFromMeeting, deleteMeeting } = useProjects();
    const [emailInputs, setEmailInputs] = useState<{ [key: string]: string }>({});
    const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    document.title = "OncoLens | Meetings";

    useEffect(() => {
        if (!user?._id) return;
        fetchMeetings();
    }, [user?._id]);

    const handleCreateMeeting = async (meeting: { name: string; date: string }) => {
        await createMeeting(meeting);
    };

    const handleStartMeeting = async (meeting: any) => {
        try {
            await axios.post(
                `http://localhost:8000/api/meeting/${meeting._id}/start`,
                { adminId: user?._id, meetingId: meeting._id },
                { withCredentials: true }
            );

            window.open(meeting.link || `${window.location.origin}/meeting/${meeting._id}`, "_blank");
        } catch (err) {
            // console.error("Failed to start meeting:", err);
        }
    };

    const handleAddParticipant = async (meetingId: string) => {
        const email = (emailInputs[meetingId] || "").trim();
        if (!email) return;

        const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRx.test(email)) {
            toast.error("Invalid email");
            return;
        }

        if (meetings[0].adminEmail === emailInputs[meetingId]) {
            toast.error("You cannot add yourself as a participant!");
            return;
        }

        // console.log(meetings[0]);

        if (meetings[0].invitees.includes(emailInputs[meetingId])) {
            toast.error("Participant already added!");
            return;
        }

        // // console.log(meetings[0].adminEmail);
        // // console.log(emailInputs[meetingId]);

        try {

            await addParticipantToMeeting(meetingId, email);
            setEmailInputs(prev => ({ ...prev, [meetingId]: "" }));
            requestAnimationFrame(() => inputRefs.current[meetingId]?.focus());
        } catch (error) {
            // console.error("Failed to add participant:", error);
        }

    };

    const handleDeleteParticipant = async (meetingId: string, email: string) => {
        await deleteParticipantFromMeeting(meetingId, email);
        fetchMeetings();
    };

    const handleDeleteMeeting = async (meetingId: string) => {
        await deleteMeeting(meetingId);
        fetchMeetings();
    };

    const isAdmin = (meeting: any) => {
        if (!user) return false;
        return meeting.userId === user._id || meeting.admin === user._id || meeting.adminEmail === user.email;
    };

    return (
        <div className="p-8">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-semibold text-gray-800">Meetings</h1>
                <button
                    onClick={() => setOpen(true)}
                    className="flex items-center gap-2 bg-orange-600 text-white px-5 py-3 rounded-xl shadow hover:bg-orange-700 transition"
                >
                    <FaVideo size={18} /> Create Meeting
                </button>
            </div>

            {/* LIST */}
            <div className="flex flex-col gap-4">
                {meetings.length === 0 ? (
                    <p className="text-gray-500">No meetings scheduled yet.</p>
                ) : (
                    meetings.map(meeting => (
                        <div key={meeting._id} className="flex flex-col gap-3 p-4 bg-white rounded-xl shadow border border-gray-200">
                            {/* TOP ROW */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="font-semibold text-lg">{meeting.name}</h2>
                                    <p className="text-gray-500 text-sm">{new Date(meeting.date).toLocaleString()}</p>
                                    {meeting.status && (
                                        <p className={`mt-2 ${meeting.status === "started" ? "text-green-600 text-sm" : meeting.status === "ended" ? "text-red-600 text-sm" : "text-yellow-600 text-sm"}`}>
                                            {meeting.status[0].toUpperCase() + meeting.status.slice(1)}
                                        </p>
                                    )}
                                </div>

                                {/* ACTIONS */}
                                <div className="relative w-full h-24"> {/* container with enough height */}
                                    {/* Action buttons on the top-right */}
                                    <div className="absolute right-0 top-0 flex flex-wrap gap-3">
                                        {isAdmin(meeting) ? (
                                        <button
                                            onClick={() => handleStartMeeting(meeting)}
                                            className="flex items-center gap-1 bg-transparent text-black border border-green-300 hover:text-white px-3 py-1 rounded hover:bg-green-700 transition"
                                        >
                                            <FaPlay /> Start
                                        </button>
                                        ) : (
                                        <>
                                            <button
                                            onClick={() =>
                                                window.open(
                                                meeting.link || `${window.location.origin}/meeting/${meeting._id}`,
                                                "_blank"
                                                )
                                            }
                                            className="flex items-center gap-1 bg-transparent text-black border border-green-300 hover:text-white px-3 py-1 rounded hover:bg-green-700 transition"
                                            >
                                            <FaPlay /> Join
                                            </button>
                                            <button
                                            onClick={() => handleDeleteParticipant(meeting._id, user?.email)}
                                            className="flex items-center gap-1 bg-transparent text-black border border-red-300 hover:text-white px-3 py-1 rounded hover:bg-red-700 transition"
                                            >
                                            <FaSignOutAlt /> Leave
                                            </button>
                                        </>
                                        )}
                                    </div>

                                    {/* Copy Link button at the bottom-right */}
                                    <div className="absolute right-0 bottom-0">
                                        <button
                                        onClick={() =>
                                            navigator.clipboard.writeText(
                                            meeting.link || `${window.location.origin}/meeting/${meeting._id}`
                                            )
                                        }
                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 px-3 py-1 border border-blue-200 rounded transition"
                                        >
                                        <FaLink /> Copy Link
                                        </button>
                                    </div>
                                </div>


                            </div>

                            {/* PARTICIPANTS */}
                            <div className="flex flex-col gap-2 mt-3">
                                <p className="font-semibold text-sm">Participants:</p>
                                <div className="flex flex-wrap gap-2">
                                    {meeting.invitees?.length ? (
                                        meeting.invitees.map(email => (
                                            <span key={`${meeting._id}-${email}`} className="relative group bg-gray-100 px-2 py-1 rounded-full text-sm flex items-center">
                                                {email}
                                                {(user?.email === meeting.adminEmail || email === user.email) && (
                                                    <button
                                                        onClick={() => handleDeleteParticipant(meeting._id, email)}
                                                        className="ml-2 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-600 transition text-xs"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </span>
                                        ))
                                    ) : (
                                        <span key={`${meeting._id}-no-participants`} className="text-gray-400 text-sm">No participants yet.</span>
                                    )}
                                </div>

                                {isAdmin(meeting) && (
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            ref={el => (inputRefs.current[meeting._id] = el)}
                                            type="email"
                                            placeholder="Add participant email"
                                            value={emailInputs[meeting._id] || ""}
                                            onChange={e => setEmailInputs(prev => ({ ...prev, [meeting._id]: e.target.value }))}
                                            className="border rounded px-2 py-1 flex-1"
                                        />
                                        <button onClick={() => handleAddParticipant(meeting._id)} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition">
                                            <FaUserPlus /> Add
                                        </button>
                                        <button onClick={() => handleDeleteMeeting(meeting._id)} className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition">
                                            <FaTrash /> Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {open && <CreateMeetingModal onClose={() => setOpen(false)} onCreate={handleCreateMeeting} />}
        </div>
    );
};

export default MeetingPage;
