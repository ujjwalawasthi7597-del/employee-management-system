# Employee Management System (EMS)

A modern full-stack Employee Management System designed to simplify employee administration, attendance tracking, leave management, payroll records, project management, and HR operations through a centralized platform.

🌐 **Live Demo:** [Employee Management System](https://ais-dev-nbj6etcc4xr6cyqu22wph2-665529278416.asia-east1.run.app)
## 📸 Application Dashboard

![Employee Management System Dashboard](Dashboard.png)
## 📌 Overview

The Employee Management System (EMS) is a web-based application designed to help organizations manage employee information and HR workflows efficiently.

The system provides a centralized platform for employee records, department management, attendance, leave requests, role-based access, and organizational reporting. Its modular architecture can be extended with additional HR features as the project evolves.

## ✨ Features

### 👥 Employee Management
- Create, view, and update employee records.
- Maintain employee profiles and employment information.
- Manage employee IDs, departments, designations, and reporting managers.
- Search, filter, and organize employee records.
- Track employee status and employment history.

### 🔐 Authentication and Authorization
- Secure user authentication.
- Role-based access control.
- Protected application routes and APIs.
- Separate permissions for administrators, HR managers, department managers, and employees.
- Secure password handling and session management.

### 🏢 Department Management
- Create and manage departments.
- Assign employees to departments.
- Manage department heads and designations.
- View department-wise employee information.

### 📊 Dashboard and Analytics
- Centralized dashboard for employee management.
- Employee statistics and organizational summaries.
- Department-wise workforce insights.
- Attendance and leave summaries.
- Visual reports and key performance indicators.

### 🕒 Attendance Management
- Employee check-in and check-out.
- Attendance history and daily summaries.
- Attendance status tracking.
- Late arrivals and working-hours tracking.
- Attendance reports and filtering.

### 🏖️ Leave Management
- Submit leave requests.
- Track leave request status.
- Approve or reject leave applications based on permissions.
- Maintain leave history and balances.
- Manage leave types and organizational leave policies.

### 💰 Payroll Management
- Maintain employee salary records.
- Track payroll periods and payment status.
- Manage salary components and deductions.
- Generate and manage payslips.
- Restrict salary information to authorized users.

### 📋 Project and Task Management
- Create and manage projects.
- Assign tasks to employees.
- Set priorities and deadlines.
- Track task progress and completion status.
- Monitor project activities and overdue tasks.

### 🔔 Notifications and Announcements
- Display organizational announcements.
- Notify employees about relevant workflow updates.
- Track notifications and read status.
- Support email or real-time notifications when configured.

### 📈 Reports and Data Management
- Employee and department reports.
- Attendance and leave summaries.
- Payroll reports for authorized users.
- Search, filter, and export supported records.
- Centralized data management.

### 📱 Responsive User Interface
- Modern dashboard interface.
- Responsive layouts for desktop, tablet, and mobile.
- Reusable UI components.
- Form validation and user-friendly feedback.
- Consistent navigation and organized application pages.

> Feature availability depends on the current implementation. Only describe a feature as completed after verifying that it works in the deployed application.

## 🛠️ Technology Stack

The intended technology stack includes:

| Category | Technology |
|---|---|
| Frontend | React.js |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router |
| Backend | Node.js |
| API Framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT and password hashing |
| Charts | Recharts |
| Icons | Lucide React |
| Version Control | Git and GitHub |
| Deployment | Configured cloud hosting |

Update this list to match the actual dependencies used by the project.

## 🏗️ Application Architecture

The application follows a frontend-backend-database architecture.

```text
                  Employee / Admin
                         |
                         v
                 React Frontend
                         |
                    REST API
                         |
                         v
                  Express Server
                         |
              Authentication & RBAC
                         |
                         v
                  Business Logic
                         |
                         v
                     MongoDB
```

### Main Components

- **Frontend:** Provides the user interface, dashboards, forms, and employee workflows.
- **Backend:** Handles API requests, validation, authorization, and business logic.
- **Database:** Stores employee records and other application data.
- **Authentication:** Protects access to private application resources.
- **Deployment:** Makes the application accessible through a hosted URL.

## 📂 Suggested Project Structure

```text
employee-management-system/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   └── app.js
│   └── package.json
│
├── .gitignore
├── README.md
└── .env.example
```

The actual project structure may differ depending on the implementation.

## ⚙️ Installation and Setup

### Prerequisites

Install the following tools:

- Node.js and npm
- Git
- MongoDB locally or a MongoDB Atlas database
- A code editor such as Visual Studio Code

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Navigate to the project directory:

```bash
cd employee-management-system
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.

### 2. Install Backend Dependencies

If the backend is located in the `server` directory:

```bash
cd server
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the backend directory.

Example configuration:

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb://127.0.0.1:27017/employee_management_system

JWT_SECRET=replace_with_a_secure_random_secret

CLIENT_URL=http://localhost:5173
```

Add any other variables required by your implementation.

Never commit real passwords, API keys, database credentials, or deployment tokens.

### 4. Start the Backend

Run the development command defined in the backend's `package.json`. For example:

```bash
npm run dev
```

### 5. Install Frontend Dependencies

Open a new terminal:

```bash
cd client
npm install
```

### 6. Configure the Frontend

If the frontend uses an API base URL, create a `.env` file inside the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Use the correct URL and API prefix for your backend.

### 7. Start the Frontend

```bash
npm run dev
```

Open the local URL printed in the terminal by Vite.

> These commands assume a separate `client` and `server` structure. If your repository uses a different structure or scripts, follow its actual configuration.

## 🔑 User Roles

The application can support the following roles:

| Role | Responsibilities |
|---|---|
| Super Admin | Organization settings, users, roles, and system administration |
| HR Manager | Employee records, attendance, leave, and HR operations |
| Department Manager | Team management, task assignments, and leave approvals |
| Employee | Personal profile, attendance, leave requests, and assigned tasks |

Access to sensitive information, including payroll and employee documents, should be enforced by backend authorization checks.

## 🔒 Security Considerations

- Store passwords using a secure password-hashing algorithm.
- Protect private routes and APIs.
- Validate and sanitize user input.
- Enforce role-based permissions on the server.
- Store secrets in environment variables.
- Configure CORS for trusted origins.
- Use HTTPS in production.
- Apply rate limiting to sensitive endpoints.
- Restrict access to personal information and payroll records.
- Never expose database credentials or tokens in frontend code.
- Use appropriate database backups and access controls.

## 🚀 Deployment

The deployed application can be accessed here:

**[
