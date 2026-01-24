import { useState } from "react";
import { useUser } from "../../context/UserContext";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Props {
    onClose: () => void;
    onCreate: (meeting: { name: string; date: string; invitees: string[] }) => void;
}

const CreateMeetingModal: React.FC<Props> = ({ onClose, onCreate }) => {
    const user = useUser();
    const userEmail = user?.user?.email || "";

    const [name, setName] = useState("");
    const [date, setDate] = useState("");
    const [loading, setLoading] = useState(false);

    const [inviteInput, setInviteInput] = useState("");
    const [invitees, setInvitees] = useState<string[]>([]);

    const now = new Date();
    const minDateTime = now.toISOString().slice(0, 16);

    const handleCreate = async () => {
        if (!name || !date) {
            toast.error("Please fill in all fields!");
            return;
        }
        setLoading(true);

        await onCreate({ name, date, invitees });
        setLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 backdrop-blur-sm">
            <div className="bg-white w-96 rounded-2xl p-6 shadow-xl border border-gray-200">
                <ToastContainer
                    position="top-center"
                    autoClose={2000}
                    hideProgressBar
                    newestOnTop
                    pauseOnHover
                    theme="light"
                    closeButton={false}
                />

                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Create Meeting
                </h2>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleCreate();
                    }}
                >
                    {/* Meeting Name */}
                    <input
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
                        placeholder="Meeting Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />

                    {/* Date */}
                    <input
                        type="datetime-local"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        min={minDateTime}
                    />

                    {/* Invite Members */}
                    <label className="text-sm font-medium text-gray-600 mb-1 block">
                        Invite Members
                    </label>

                    <div
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 flex items-center flex-wrap gap-2 mb-4"
                        onClick={() =>
                            document.getElementById("invite-input")?.focus()
                        }
                    >
                        {invitees.map((email, index) => (
                            <div
                                key={index}
                                className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1"
                            >
                                <span>{email}</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setInvitees(
                                            invitees.filter(
                                                (_, i) => i !== index
                                            )
                                        )
                                    }
                                    className="text-blue-700 hover:text-blue-900"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        {/* Input */}
                        <input
                            id="invite-input"
                            className="flex-1 min-w-[120px] outline-none"
                            placeholder="Type email + Enter"
                            value={inviteInput}
                            onChange={(e) => setInviteInput(e.target.value)}
                            onKeyDown={(e) => {
                                const email = inviteInput.trim();

                                if (e.key === "Enter") {
                                    e.preventDefault();

                                    // Empty?
                                    if (!email) return;

                                    // Valid email?
                                    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                                    if (!valid) {
                                        toast.error("Invalid email!");
                                        return;
                                    }

                                    // Check against user email
                                    if (email === userEmail) {
                                        // optional: shake animation
                                        const inputEl = document.getElementById("invite-input");
                                        inputEl?.classList.add("animate-shake");
                                        console.log("You cannot invite yourself!");
                                        toast.error("You cannot invite yourself!");
                                        setTimeout(() => {
                                            inputEl?.classList.remove("animate-shake");
                                        }, 400);
                                        return;
                                    }

                                    // Prevent duplicates
                                    if (invitees.includes(email)) {
                                        toast.error("Email already invited!");
                                        return;
                                    };

                                    // Add
                                    setInvitees([...invitees, email]);
                                    setInviteInput("");
                                }

                                // Backspace removes last badge
                                if (e.key === "Backspace" && inviteInput === "") {
                                    setInvitees(invitees.slice(0, -1));
                                }
                            }}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:bg-blue-300"
                        >
                            {loading ? "Creating..." : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateMeetingModal;
