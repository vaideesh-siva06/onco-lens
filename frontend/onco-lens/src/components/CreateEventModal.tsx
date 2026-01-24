import React, { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { Temporal } from "@js-temporal/polyfill";

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    editMode?: boolean;
    eventData?: any;
    onSave: (event: any) => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({
    isOpen,
    onClose,
    editMode = false,
    eventData = null,
    onSave,
}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [participants, setParticipants] = useState<string[]>([]);
    const [emailInput, setEmailInput] = useState("");
    const [allDay, setAllDay] = useState(false);

    // PRE-FILL WHEN EDIT MODE
    useEffect(() => {
        if (editMode && eventData) {
            setTitle(eventData.title || "");
            setDescription(eventData.description || "");

            const start = Temporal.ZonedDateTime.from(eventData.start);
            const end = Temporal.ZonedDateTime.from(eventData.end);

            setDate(start.toPlainDate().toString());
            setStartTime(start.toPlainTime().toString().slice(0, 5));
            setEndTime(end.toPlainTime().toString().slice(0, 5));

            setParticipants(eventData.participants || []);
        }
    }, [editMode, eventData]);

    // Prevent scroll behind modal
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => (document.body.style.overflow = "");
    }, [isOpen]);

    if (!isOpen) return null;

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setDate("");
        setStartTime("");
        setEndTime("");
        setParticipants([]);
        setEmailInput("");
        setAllDay(false);
    };

    const handleAddEmail = () => {
        const trimmed = emailInput.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!trimmed) return;
        if (!emailRegex.test(trimmed)) {
            toast.error("Invalid email format");
            return;
        }
        if (!participants.includes(trimmed)) {
            setParticipants([...participants, trimmed]);
        }
        setEmailInput("");
    };

    const handleEmailKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddEmail();
        }
    };

    const removeEmail = (email: string) => {
        setParticipants(participants.filter((p) => p !== email));
    };

    const handleSubmit = () => {
        if (!title || !date) {
            toast.error("Title and date are required");
            return;
        }

        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

        let start = Temporal.ZonedDateTime.from(`${date}T${startTime || "00:00"}[${tz}]`);
        let end = Temporal.ZonedDateTime.from(`${date}T${endTime || "23:59"}[${tz}]`);

        if (end <= start) {
            toast.error("End time must be after start time");
            return;
        }

        const eventObj = {
            id: eventData?.id || `${Date.now()}`, // new id
            title,
            description,
            start,
            end,
            participants,
        };

        onSave(eventObj);
        toast.success(editMode ? "Event updated" : "Event created");

        resetForm();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">

                {/* Close */}
                <button
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                    onClick={() => {
                        resetForm();
                        onClose();
                    }}
                >
                    <FaTimes />
                </button>

                <h2 className="text-2xl font-bold mb-6 text-center">
                    {editMode ? "Edit Event" : "Create Event"}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* TITLE */}
                    <div className="col-span-1">
                        <label className="block text-gray-700 mb-1">
                            Event Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400"
                            required
                        />
                    </div>

                    {/* DATE */}
                    <div className="col-span-1">
                        <label className="block text-gray-700 mb-1">Date *</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    {/* TIME */}
                    {!allDay && (
                        <>
                            <div>
                                <label className="block text-gray-700 mb-1">Start Time</label>
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-1">End Time</label>
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400"
                                />
                            </div>
                        </>
                    )}

                    {/* ALL DAY TOGGLE */}
                    <div className="col-span-2 flex items-center gap-2 mt-2">
                        <input
                            type="checkbox"
                            checked={allDay}
                            onChange={() => setAllDay(!allDay)}
                        />
                        <span className="text-gray-700">All Day Event</span>
                    </div>

                    {/* PARTICIPANTS */}
                    <div className="col-span-2">
                        <label className="block text-gray-700 mb-1">Participants (Optional)</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {participants.map((email) => (
                                <div
                                    key={email}
                                    className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                >
                                    {email}
                                    <button
                                        className="ml-1 hover:text-blue-900"
                                        onClick={() => removeEmail(email)}
                                    >
                                        <FaTimes size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <input
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            onKeyDown={handleEmailKeyDown}
                            placeholder="Type email + Enter"
                            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    {/* DESCRIPTION */}
                    <div className="col-span-2">
                        <label className="block text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400"
                        />
                    </div>

                    {/* SUBMIT */}
                    <div className="col-span-2">
                        <button
                            onClick={handleSubmit}
                            className="w-full bg-orange-500 text-white py-2 rounded-md hover:bg-orange-600 transition"
                        >
                            {editMode ? "Update Event" : "Create Event"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateEventModal;
