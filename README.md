# Cancer Research Collaboration Platform

A **full-stack web application** designed to streamline **cancer research projects**, team collaboration, chat, and document sharing. Integrated with **Google Drive** for storing research documents and **Redis** for caching project and document data.  

Built with **React**, **TypeScript**, **Node.js/Express**, **MongoDB**, and **Socket.IO** for real-time collaboration.

---

## Table of Contents

- [Features](#features)  
- [Tech Stack](#tech-stack)  
- [Getting Started](#getting-started)  
- [Folder Structure](#folder-structure)  
- [API Endpoints](#api-endpoints)  
- [Google Drive Integration](#google-drive-integration)  
- [Caching](#caching)  
- [Real-Time Chat](#real-time-chat)  
- [Machine Learning Model](#machine-learning-model)
- [Contributing](#contributing)  
- [License](#license)

---

## Features

- **Project Management**
  - Create and manage cancer research projects.
  - Define project details: focus, status, and cancer types (e.g., brain, lung, breast).
  - Assign project admins and team members.

- **Team Management**
  - Add or remove team members.
  - Admin controls for sensitive actions.
  - Real-time updates on team changes.

- **User Management**
  - Update profile info (name, email, password).
  - Automatic update of document authorship and chat usernames on profile change.

- **Document Management**
  - Store research documents in **Google Drive**.
  - Control document access for team members.
  - Automatically revoke access when a user is removed from a project.

- **Machine Learning Model**
  - Integrated ML model for analyzing cancer-related data.
  - Supports predictions or classifications for different cancer types.
  - Model can assist researchers in identifying patterns or trends in clinical data.
  - Easily extendable to incorporate new datasets or cancer markers.

- **Real-Time Chat**
  - Send messages instantly to team members.
  - Online/offline status indicators.
  - Emoji picker and scroll-to-bottom “new message” notifications.

- **Caching**
  - Uses **Redis** for faster access to project and document data.
  - Automatic cache invalidation when data changes.

---

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion  
- **Backend:** Node.js, Express, TypeScript  
- **Database:** MongoDB  
- **Cache:** Redis  
- **Authentication:** JWT, cookies  
- **Real-Time:** Socket.IO  
- **Machine Learning:** Python ML model integrated with Node.js backend  
- **External APIs:** Google Drive API  
- **Notifications:** React Toastify  

---

## Getting Started

### Prerequisites

- Node.js >= 18  
- MongoDB  
- Redis  
- Google Cloud credentials for Drive API  
- Python 3.x for machine learning model  

## Backend Setup

Create a `.env` file in the **server** folder with the following content:

* MONGO_URI=your_mongodb_uri
* JWT_SECRET=your_jwt_secret
* GOOGLE_CLIENT_ID=your_google_client_id
* GOOGLE_CLIENT_SECRET=your_google_client_secret

Install dependencies:
* cd backend
* npm install
* npm install bcrypt dotenv http cors express cookie-parser


Start the server:
* npm run dev

   
## Frontend Setup

Install dependencies:

* cd frontend
* npm install 
* npm install axios toastify


Start the frontend:
npm run dev


## Folder Structure
/frontend # React frontend
/backend # Node.js backend


- `client/src/components` – React components for projects, chat, members, and documents.  
- `backend/controllers` – API controllers for users, projects, documents, chat, and ML integration.  
- `backend/models` – Mongoose models (User, Project, Document, Chat).  
- `backend/routes` – Express routes for REST APIs.  
- `backend/api/model` – Python scripts or model files for cancer prediction.  

## Google Drive Integration

- Documents are stored in **Google Drive folders per project**.  
- When a user is removed from a project, their access to related Google Docs is revoked.  
- Requires OAuth2 credentials: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.  

## Caching

- **Redis** is used to cache:  
  - Project lists per user  
  - Project documents  
- Caches are invalidated automatically when:  
  - Project data changes  
  - User information is updated  
  - Members are added or removed  

## Real-Time Chat

- Powered by **Socket.IO**  
- Features:  
  - Online/offline status for each team member  
  - Emoji support  
  - Auto-scroll and “new message” indicators  

## Machine Learning Model

- Built using Python and integrated with the Node.js backend.  
- Designed to analyze cancer datasets and predict cancer types or outcomes.  
- Outputs are used to support project decisions and research insights.  
- Easily extendable to include new data, cancer markers, or model improvements.  

---

## Contributing

- Fork the repository.  
- Create a new branch: `git checkout -b feature/your-feature`.  
- Commit changes: `git commit -m "Add feature"`.  
- Push to branch: `git push origin feature/your-feature`.  
- Open a Pull Request.  

