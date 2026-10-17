<div align="center">

# 📊 BITMAX GROUP — LEAD MANAGEMENT CRM

### 🚀 Full-Stack MERN Business Development & Sales Lead Management Platform

<img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=24&duration=3000&pause=1000&color=2563EB&center=true&vCenter=true&width=900&lines=Smart+Lead+Management+CRM;Business+Development+Workflow+Automation;Real-Time+Lead+Tracking;Follow-Up+and+Meeting+Management;Role-Based+Access+Control;PDF+and+Excel+Reporting" />

<br/>

<img src="https://img.shields.io/badge/Frontend-React.js-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/Build-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
<img src="https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" />
<img src="https://img.shields.io/badge/Framework-Express.js-000000?style=for-the-badge&logo=express" />
<img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
<img src="https://img.shields.io/badge/Cache%20%26%20Jobs-Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
<img src="https://img.shields.io/badge/Real--Time-Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
<img src="https://img.shields.io/badge/Reports-PDF%20%26%20Excel-217346?style=for-the-badge&logo=microsoftexcel&logoColor=white" />

<br/>
<br/>

> ### 🎯 Centralizing Lead Capture, BD Activities, Follow-Ups, Meetings, Ownership, and Sales Performance Reporting

</div>

---

# 📖 Overview

<div align="center">

### 📊 A centralized CRM for managing the complete Business Development (BD) and Sales lead lifecycle.

</div>

The **Bitmax Group Lead Management CRM** is designed to capture prospect and company information, assign leads to Business Development employees, track project pitches, schedule follow-ups and meetings, monitor lead stages, and measure individual and team performance.

The application uses a MERN-based architecture with **React and Vite** for the frontend, **Node.js and Express.js** for backend APIs, and **MongoDB** for persistent business data. **Redis** supports background processing and coordination, while **Socket.IO** delivers authorized real-time updates.

The backend is the authoritative layer for validation, workflow rules, permissions, data integrity, and reporting. Core CRM workflows must operate without AI services. Reports are generated within the CRM and downloaded for manual distribution.

> **Implementation note:** This README describes the functional baseline from the Lead Management CRM specification. Listing a capability here does not by itself mean that its code, provider integration, or production deployment has already been completed.

### 🎯 Key Objectives

- 📥 Centralize lead creation from manual, website, advertising, referral, and import channels.
- 👤 Maintain clear lead ownership, BD attribution, and assignment history.
- 🧾 Capture contact, company/center, GST, project-pitch, interest, and pipeline information.
- 🔁 Schedule, complete, reschedule, and track follow-up activities.
- 🤝 Record meetings, attendees, outcomes, minutes, and next actions.
- 📊 Provide BD dashboards, management analytics, and filtered reports.
- 🔐 Apply dynamic roles and granular access-control rules.
- ⚡ Synchronize authorized lead and activity updates in real time.
- 📄 Generate professional PDF reports and provide Excel/CSV exports where enabled.
- 🛡️ Preserve audit history, validate data on the server, and protect sensitive records.

---

# ✨ Core Features

<div align="center">

| 🚀 Feature | 💡 Description |
|---|---|
| 🧾 Lead Management | Create, view, update, archive, and track lead records |
| 🏢 Contact & Company Details | Capture prospect, center/company, location, registration, and GST details |
| 🎯 Project Pitch Tracking | Record project scope, staffing, shifts, commercial details, and terms discussed |
| 🪜 Lead Pipeline | Track lead stages from New through Closed Won or Closed Lost |
| 👥 Ownership & Assignment | Assign or reassign leads with traceable ownership history |
| 🔁 Follow-Up Management | Schedule activities, record outcomes, and preserve rescheduling history |
| 🤝 Meeting Management | Track meeting status, mode, date, attendees, outcome, and minutes |
| 🔔 Notifications | Provide in-app alerts and configured browser/email reminders |
| 🗂️ Lead Sources & Imports | Track source attribution and support validated CSV/XLSX imports |
| 📊 BD Dashboard | Show assigned leads, daily activity, pending actions, and performance indicators |
| 📈 Management Analytics | Review pipeline, team performance, source distribution, and conversion metrics |
| 📄 PDF & Spreadsheet Reports | Generate permission-aware reports for download |
| 🔐 Dynamic Roles & ACL | Configure module, action, record, field, workflow, and export permissions |
| ⚡ Real-Time Board | Support table/Kanban views with authorized Socket.IO updates |
| 🧾 Audit History | Track critical changes, assignment events, closures, and administrative actions |
| 🛡️ Data Validation | Enforce required fields and conditional rules at the API layer |

</div>

---

# 🧾 Lead Capture & Company Information

## 🔥 Lead Form Fields

The lead capture form records the prospect's contact details, company/center information, project pitched, interest, operational status, and pipeline stage.

| Field | Requirement | Behaviour |
|---|---|---|
| Caller / Contact Name | Required | Full name of the person contacted |
| Mobile Number | Required | Primary contact number; validate country code and length |
| Alternate Number | Optional | Secondary contact; warn about a duplicate primary number where feasible |
| Email Address | Recommended | Validate email format |
| Center / Company Name | Required | Official business or center name |
| Center Location | Required | City, state, and country; full address may be recorded |
| Center Direct Contact Name | Optional | Owner, director, center head, or decision-maker |
| Company Type | Required | Pvt Ltd, Ltd, Partnership, LLP, Proprietorship, or Other |
| Company Registration Date | Conditional | Required for registered entities according to the approved validation policy |
| GST Registered? | Required | Yes/No selection |
| GSTIN | Conditional | Display and require when GST Registered is Yes; validate format where feasible |
| Project Details Pitched by BD | Required | Project scope, team size, shifts, payout/billing details, and key terms discussed |
| Center Interest | Required | Interested, Not Interested, Interested – Follow-up Required, On Hold, Awaiting Decision |
| Center Status | Required | Active or Inactive |
| BD Name | System-generated | Populated from authenticated user; read-only for BD users |
| Lead Active Date | System-generated | Set when the lead is first created/activated |
| Lead Active By | System-generated | Authenticated user identity; read-only and auditable |
| Lead Close Date | Conditional | Set automatically when the lead becomes Closed Won or Closed Lost |
| Lead Stage | Required | New, Contacted, Qualified, Project Pitched, Follow-up, Meeting Scheduled, Proposal/Details Shared, Negotiation, Closed Won, Closed Lost |
| Lead Close Reason | Conditional | Required for Closed Lost; includes a reason and notes where applicable |

### 🔒 Lead Data Rules

- Generate a unique Lead ID for every lead.
- Populate system-generated identity and date fields on the server.
- Do not allow ordinary BD users to edit ownership or system-generated fields.
- Keep **Lead Stage**, **Center Interest**, and **Center Status** separate; they represent different business concepts.
- Check mobile number, alternate number, email, and center/company name for possible duplicates.
- Flag possible duplicates for authorized review rather than silently overwriting records.
- Archive leads instead of permanently deleting them through the normal BD interface.
- Preserve lead history when a lead is reassigned, closed, or reopened.

---

# 🔁 Lead Lifecycle & Pipeline

<div align="center">

## ⚡ From First Contact to Closure

</div>

### 🪜 Example Lead Stages

`New → Contacted → Qualified → Project Pitched → Follow-up → Meeting Scheduled → Proposal/Details Shared → Negotiation → Closed Won / Closed Lost`

Authorized administrators can configure stage order, allowed transitions, and permissions according to the organization's workflow.

### 📡 Lead Workflow

```text
        Lead Captured
             |
             v
     Validate Required Fields
             |
             v
    Check Potential Duplicates
             |
             v
    Save Lead and Source Details
             |
             v
       Assign BD Owner
             |
             v
     Contact / Project Pitch
             |
             v
   Schedule Follow-up / Meeting
             |
             v
      Update Lead Stage
             |
             v
     Negotiation / Decision
             |
       +-----+------+
       |            |
       v            v
   Closed Won   Closed Lost
       |            |
       +-----+------+
             |
             v
   Preserve Audit and Activity History
