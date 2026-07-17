Medicio SRS	Version 1.0

**MEDICIO**

*AI-Powered Healthcare Access Platform*

**Software Requirements Specification**

(Web Application)

**Document Version 1.0**

July 11, 2026

Prepared by: Moaaz Mustafa

*Status: Draft for Stakeholder Review*

# **Revision History**

| **Version** | **Date** | **Author** | **Description** |
| --- | --- | --- | --- |
| 0.1 | Requirements session | Project stakeholders | Raw feature and role notes captured during requirements-gathering meeting. |
| 1.0 | July 11, 2026 | Moaaz Mustafa | Formalized SRS: structured into 12 modules with functional requirements, non-functional requirements, detailed module specifications, RBAC matrix, and data model. |

# **Table of Contents**

*(Right-click the table above and choose **"**Update Field**"** in Microsoft Word to populate page numbers.)*

# **1. Introduction**

## **1.1 Purpose**

This Software Requirements Specification (SRS) defines the functional and non-functional requirements for Medicio, an AI-powered healthcare access platform delivered as a web application. It translates the project's requirements-gathering session into a structured, implementable specification: twelve system modules, their functional requirements, detailed module-level specifications, non-functional requirements, a role-based access control (RBAC) matrix, a conceptual data model, and a log of assumptions and open questions raised during formalization. It is intended for the engineering, QA, product, and stakeholder audiences who will design, build, test, and sign off on the system.

## **1.2 Scope**

Medicio connects patients with an AI symptom-checking assistant, registered doctors, hospitals, pharmacies, and diagnostic labs. Core capabilities in scope for this specification include:

- A conversational AI symptom checker that triages symptoms and recommends a course of action.

- Entity-scoped and specialty-scoped AI agents bound to individual doctors, hospitals, and labs.

- Registration and management workflows for Doctors, Hospitals, Pharmacies, and Labs, including credential verification.

- Appointment discovery and booking between patients and registered doctors.

- A patient-owned medicine tracker and consolidated health-records portal.

- A Super-Admin-only data aggregation (scraping) engine that supplements registered listings with public-source data.

- Platform-wide role-based access control, audit logging, and product analytics.

Out of scope for this document: mobile-native application requirements, payment/billing processing, telemedicine (video-consultation) infrastructure, and third-party insurance integration — none of these were raised in the requirements session; they are candidates for a future revision if required.

## **1.3 Definitions, Acronyms, and Abbreviations**

| **Term** | **Definition** |
| --- | --- |
| RBAC | Role-Based Access Control — restricting system access based on a user's assigned role. |
| LLM | Large Language Model — the AI model powering the symptom checker and specialty agents. |
| POS | Point of Sale — a pharmacy's inventory/checkout system, to be synced with Medicio. |
| SRS | Software Requirements Specification — this document. |
| Scraped / Suggested Record | A Doctor, Hospital, Pharmacy, or Lab record obtained via automated aggregation from public sources rather than direct registration, shown as unverified. |
| Verified / Registered Record | A record actively maintained by an entity that has registered and been approved on Medicio. |
| Tibb | A traditional (Unani/Greco-Arabic) system of medicine referenced as a possible prior-treatment category during AI intake. |
| PostHog | An open-source product analytics platform used for event tracking across the application. |
| FR / NFR | Functional Requirement / Non-Functional Requirement. |

## **1.4 Document Conventions**

Functional requirements are identified by a module-scoped prefix (e.g., FR-IAM-01) and each carries a priority of High, Medium, or Low, reflecting relative implementation priority rather than a fixed release plan. Non-functional requirements follow the same convention under an NFR-CATEGORY-## prefix. The keyword "shall" denotes a mandatory requirement; "should" denotes a strong recommendation.

# **2. Overall Description**

## **2.1 Product Perspective**

Medicio is a new, standalone web platform rather than an extension of an existing system. It is architected as a modular system: an identity/RBAC core (M1) underpins eleven functional modules spanning AI-driven patient guidance, healthcare-entity management, booking, records, data aggregation, and analytics. Modules are designed for independent development and deployment, communicating through well-defined internal interfaces (see Section 3 and Section 4).

## **2.2 User Classes and Characteristics**

The platform serves three broad classes of user, further divided into eight roles. All roles are governed by the RBAC rules defined in Module M1 and detailed in the permission matrix in Section 6.

| **Role** | **Class** | **Description** |
| --- | --- | --- |
| Super Admin | Administrative | Full system access; the only role with access to scraper configuration, raw scraped data, and system logs; can define custom roles. |
| Admin/Manager | Administrative | Day-to-day operational administration (support, content oversight, verification approvals) without system-level, scraper, or log access. |
| Doctor | Healthcare Professional | Manages own profile, availability, and appointments; trains a personal AI agent; may be independent or hospital-affiliated. |
| Hospital Admin | Healthcare Professional | Manages a hospital's profile and its affiliated doctors, labs, and pharmacies. |
| Labs Admin | Healthcare Professional | Manages a lab's profile, test catalogue, pricing, wait times, and patient report uploads. |
| Pharmacy Admin | Healthcare Professional | Manages a pharmacy's profile and inventory, including POS-synced and manually entered stock. |
| User (Patient) | General | Primary consumer of the AI symptom checker, appointment booking, medicine tracker, and patient portal. |
| Custom Role | General | Super-Admin-defined role with a configurable permission set for scenarios outside the predefined roles. |

## **2.3 Operating Environment**

Medicio is delivered as a responsive web application, accessed via modern desktop and mobile browsers. It is assumed to be deployed on a cloud-hosted, horizontally scalable backend (see NFR-SCALE-01) with a relational or hybrid data store and a dedicated integration with an external LLM provider for AI-driven features. Specific hosting, browser-support matrix, and infrastructure provider were not specified in the requirements session and are recommended follow-up items (see Section 8).

## **2.4 Design and Implementation Constraints**

- All access-control decisions must route through the RBAC core (M1); no module may implement a parallel authorization path.

- Scraped/unregistered data must remain clearly distinguishable from verified data in every surface where both can appear (FR-SCRAPE-05).

- Verified (registered) records always take precedence over scraped records in conflicts (FR-SCRAPE-06).

- Health-related AI output is advisory only and must be accompanied by a persistent medical disclaimer (FR-AI-10, NFR-COMP-01).

## **2.5 Assumptions and Dependencies**

This specification depends on selection of an LLM provider for the AI Symptom Checker and Specialty AI Agents, and on legal review of the data-aggregation approach described in Module M11. A full list of assumptions, open questions, and recommended resolutions raised while formalizing the original requirements notes is maintained in Section 8.

# **3. System Modules Overview**

The system is decomposed into twelve modules. Module M1 (Identity & Access Control) is a cross-cutting dependency for all others; the remaining modules are grouped functionally below. Full functional requirements and detailed specifications for each module follow in Section 4.

| **Code** | **Module** | **Summary** |
| --- | --- | --- |
| M1 | Authentication & Access Control (IAM / RBAC) | Identity, authentication, and role-based authorization consumed by every other module. |
| M2 | AI Symptom Checker & Recommendation Engine | The patient-facing conversational AI ("AI Dashboard") that triages symptoms and recommends next steps. |
| M3 | Specialty AI Agents | Domain-scoped agents bound to individual Doctors/Hospitals/Labs, plus specialty-level bots (AI Dermatologist, AI Cardiologist, etc.). |
| M4 | Doctor Management | Registration, credential verification, availability, hospital affiliation, and AI-agent training for Doctors. |
| M5 | Hospital Management | Hospital profiles and their affiliated doctors, labs, and pharmacies, including enrichment of scraped listings. |
| M6 | Pharmacy Management | Pharmacy profiles, inventory, and pricing for both scraped and platform-linked pharmacies. |
| M7 | Lab Management | Lab profiles, test catalogues, pricing/wait times, and report delivery into the patient portal. |
| M8 | Appointment Booking | Discovery and booking of time with registered doctors, and the resulting schedule management. |
| M9 | Medicine Tracker | Patient medicine logging that feeds the AI Symptom Checker's intake questions. |
| M10 | Patient Portal & Health Records | A consolidated, patient-owned view of reports, medicine history, appointments, and AI consultation history. |
| M11 | Data Aggregation & Scraper Engine | Super-Admin-only aggregation of doctor/hospital/pharmacy/lab data from public sources, deduplicated against verified records. |
| M12 | Analytics, Logging & Monitoring | Full audit trail of user actions plus PostHog product analytics, visible only to Super Admin. |

# **4. Functional Requirements ****&**** Detailed Module Specifications**

Each module below lists its functional requirements (with priority) followed by a detailed specification covering description, actors, business rules, inputs, outputs, module dependencies, and any open items surfaced while formalizing the original notes.

## **  M1 — Authentication ****&**** Access Control (IAM / RBAC)**

*Identity, authentication, and role-based authorization consumed by every other module.*

### **M1.1 Functional Requirements**

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| **FR-IAM-01** | The system shall allow users to register and authenticate with account credentials. | **High** |
| **FR-IAM-02** | The system shall implement Role-Based Access Control (RBAC), restricting features and data by the user's assigned role. | **High** |
| **FR-IAM-03** | The system shall support the predefined roles: Super Admin, Admin/Manager, Doctor, Hospital Admin, Labs Admin, Pharmacy Admin, and User. | **High** |
| **FR-IAM-04** | The system shall allow a Super Admin to define Custom Roles with a configurable set of permissions. | **High** |
| **FR-IAM-05** | The system shall enforce role checks at the API level for every protected action, not only in the UI. | **High** |
| **FR-IAM-06** | The system shall use token-based session management with session expiry. | **Medium** |
| **FR-IAM-07** | The system shall support account-verification workflows for Healthcare Professional roles prior to granting full access (see Doctor, Hospital, Pharmacy, and Lab Management). | **Medium** |

### **M1.2 Detailed Specification**

| **Description** | Provides identity, authentication, and authorization for the whole platform. Every other module ultimately defers its access-control decisions to this module. |
| --- | --- |
| **Actors** | All roles. |
| **Business Rules** | RBAC is enforced platform-wide; no module may bypass it. Custom roles are configurable only by Super Admin. Role checks are enforced server-side; the UI reflecting a role is a convenience, not a security boundary. |
| **Inputs** | • Registration details • Login credentials • Role assignment / affiliation requests |
| **Outputs** | • Authenticated session/token • Resolved permission set for the session |
| **Dependencies** | Consumed by all other modules (M2–M12). |
| **Open Notes** | The exact authentication mechanism (password-based vs. OAuth/social login) was not specified in the meeting notes. Assumed standard email/password with room to extend — confirm with stakeholders. |

## **  M2 — AI Symptom Checker ****&**** Recommendation Engine**

*The patient-facing conversational AI (**"**AI Dashboard**"**) that triages symptoms and recommends next steps.*

### **M2.1 Functional Requirements**

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| **FR-AI-01** | The system shall provide an AI-driven symptom checker accepting natural-language or structured symptom input. | **High** |
| **FR-AI-02** | Before generating a result, the system shall collect: duration of symptoms, medicines already used, major pre-existing conditions (e.g., diabetes), and current/prior treatment approach (e.g., homeopathic, Tibb). | **High** |
| **FR-AI-03** | The system shall cross-check any suggested medicine against the patient's disclosed conditions and medicine history before presenting it. | **High** |
| **FR-AI-04** | The system shall output: an estimated severity level, a ranked list of possible conditions, a doctor-visit recommendation (yes/no), whether precautions or temporary medicine suffice, and specific temporary medicine suggestions where appropriate. | **High** |
| **FR-AI-05** | When a doctor visit is recommended, the system shall suggest nearby doctors matching the required specialization, prioritizing Medicio-registered doctors over scraped listings. | **High** |
| **FR-AI-06** | The system shall recommend a doctor visit only when clinically warranted by the intake logic, avoiding unnecessary referrals. | **High** |
| **FR-AI-07** | The system shall retrieve and present nearby pharmacies and labs relevant to the recommendation alongside doctor suggestions. | **High** |
| **FR-AI-08** | If no registered provider is available nearby, the system shall fall back to scraped/unregistered listings, clearly labeled as such. | **High** |
| **FR-AI-09** | The system shall determine patient location via device geolocation (with consent) or manual entry if geolocation is unavailable or declined. | **High** |
| **FR-AI-10** | The system shall display a persistent medical disclaimer clarifying that AI guidance does not replace a professional diagnosis. | **Medium** |

### **M2.2 Detailed Specification**

| **Description** | The primary patient entry point: a conversational AI that triages symptoms, runs a structured intake, and produces a severity assessment plus provider/medicine recommendations. |
| --- | --- |
| **Actors** | User (primary); Super Admin/Admin (monitoring). |
| **Business Rules** | Intake questions (duration, prior medicine, conditions, treatment history) are mandatory before a result is generated. Suggested medicine must be checked against disclosed conditions and history. Registered providers are always preferred over scraped ones; a doctor is suggested only when actually needed. |
| **Inputs** | • Free-text/structured symptom description • Intake question answers • Device geolocation or manual location |
| **Outputs** | • Severity level • Possible-condition list • Visit recommendation • Temporary medicine suggestion • Ranked nearby doctor/pharmacy/lab suggestions |
| **Dependencies** | M4 Doctor Management, M6 Pharmacy Management, M7 Lab Management, M11 Scraper Engine (fallback listings), M9 Medicine Tracker (history context). |
| **Open Notes** | The underlying LLM/provider and its medical-safety guardrails are not specified in the notes — confirm which LLM API will be used and what safety review applies given the health context. |

## **  M3 — Specialty AI Agents**

*Domain-scoped agents bound to individual Doctors/Hospitals/Labs, plus specialty-level bots (AI Dermatologist, AI Cardiologist, etc.).*

### **M3.1 Functional Requirements**

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| **FR-AGENT-01** | The system shall provide dedicated AI agents scoped to each entity type: Doctor Agent, Hospital Agent, and Lab Agent. | **High** |
| **FR-AGENT-02** | Each entity-scoped agent shall answer only questions relevant to its own bound entity or domain (e.g., a Doctor Agent answers only about that doctor's availability, qualifications, and specialty guidance). | **High** |
| **FR-AGENT-03** | The system shall provide specialty-level AI personas (e.g., AI Dermatologist, AI Cardiologist) trained on real consultation data from doctors of that specialty. | **High** |
| **FR-AGENT-04** | Specialty AI agents shall be able to recommend booking a consultation with a real doctor, refer a medicine, refer a lab test, and provide best-practice and precaution guidance. | **High** |
| **FR-AGENT-05** | The system shall provide Doctors a structured, specialty-specific question set used to train their personal/emergency-response AI agent. | **High** |
| **FR-AGENT-06** | The system shall maintain traceability from each agent conversation back to the source doctor/hospital/lab entity that supplied its training data. | **Low** |

### **M3.2 Detailed Specification**

| **Description** | A family of narrow, domain-bound conversational agents — one per registered Doctor/Hospital/Lab, plus specialty-wide personas — each restricted to answering within its own scope. |
| --- | --- |
| **Actors** | User; Doctor (trains the agent); Super Admin. |
| **Business Rules** | An agent must not answer outside its bound entity or specialty scope. Specialty bots are trained from real doctor consultation data. Agents may take referral actions: book a real consultation, refer medicine, refer a lab test. |
| **Inputs** | • Doctor-provided training Q&A set (per specialty) • User queries |
| **Outputs** | • Domain-scoped answers • Referral actions (booking, medicine, lab test) |
| **Dependencies** | M4 Doctor Management (training-data source), M8 Appointment Booking (referral action), M7 Lab Management (referral action). |
| **Open Notes** | Training-data governance — consent and anonymization of real consultation data used to train agents — is not addressed in the notes and should be treated as a compliance item (see Section 8). |

## **  M4 — Doctor Management**

*Registration, credential verification, availability, hospital affiliation, and AI-agent training for Doctors.*

### **M4.1 Functional Requirements**

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| **FR-DOC-01** | The system shall allow Doctors to register and submit credentials/education for verification. | **High** |
| **FR-DOC-02** | The system shall restrict full platform registration to doctors whose credentials have been verified by an authorized administrator. | **High** |
| **FR-DOC-03** | The system shall allow Doctors to manage their own availability schedule directly. | **High** |
| **FR-DOC-04** | For hospital-affiliated doctors, the system shall allow the Hospital Admin to view/manage the doctor's listed details while the doctor retains direct control of their own availability. | **High** |
| **FR-DOC-05** | The system shall support bidirectional affiliation requests: a hospital may request an already-registered doctor by ID, and a doctor may request affiliation with a hospital. | **High** |
| **FR-DOC-06** | The system shall allow independent (clinic-based, non-hospital-affiliated) doctors to maintain a standalone profile. | **Medium** |
| **FR-DOC-07** | The system shall allow doctors not yet registered on the platform to appear as scraped/suggested listings. | **Medium** |
| **FR-DOC-08** | The system shall allow Doctors to train their personal AI agent by answering the specialty-specific emergency question set. | **High** |
| **FR-DOC-09** | The system shall allow Doctors to view and manage their appointments (accept, reschedule, cancel, mark complete). | **High** |

### **M4.2 Detailed Specification**

| **Description** | Manages the full lifecycle of a Doctor's presence on the platform: registration, credential verification, availability, hospital affiliation, and personal AI-agent training. |
| --- | --- |
| **Actors** | Doctor; Hospital Admin; Super Admin/Admin (verification). |
| **Business Rules** | Only credential-verified doctors may be fully registered. Hospital affiliation is bidirectional (either side can initiate). A doctor's own availability is always doctor-controlled, even when hospital-affiliated. |
| **Inputs** | • Registration and credential documents • Availability schedule • Affiliation requests • AI-agent training answers |
| **Outputs** | • Verified doctor profile • Availability calendar • Trained personal agent |
| **Dependencies** | M1 IAM/RBAC, M5 Hospital Management, M3 Specialty AI Agents, M8 Appointment Booking, M11 Scraper Engine (unregistered listings). |
| **Open Notes** | The verification workflow (required documents, reviewer role, turnaround SLA) is not detailed in the notes and should be defined with stakeholders. |

## **  M5 — Hospital Management**

*Hospital profiles and their affiliated doctors, labs, and pharmacies, including enrichment of scraped listings.*

### **M5.1 Functional Requirements**

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| **FR-HOSP-01** | The system shall allow Hospital Admins to register a hospital profile listing its facilities. | **High** |
| **FR-HOSP-02** | The system shall allow Hospital Admins to view and manage affiliated Doctors, Labs, and Pharmacies as linked sections of the hospital profile. | **High** |
| **FR-HOSP-03** | The system shall allow a hospital's affiliated Doctors to independently update their own availability. | **Medium** |
| **FR-HOSP-04** | For scraped hospital records with a discoverable public website, the system shall attempt to enrich the record with listed specialists, treatments, and internal labs. | **Medium** |
| **FR-HOSP-05** | The system shall show scraped (unregistered) hospital records with no default distance cap, with the User able to manually narrow the search radius. | **Medium** |

### **M5.2 Detailed Specification**

| **Description** | Manages hospital profiles and the facilities, doctors, labs, and pharmacies affiliated with a hospital, including website-based enrichment of scraped hospital records. |
| --- | --- |
| **Actors** | Hospital Admin; Doctor (own availability); Super Admin/Admin. |
| **Business Rules** | Scraped hospital listings default to an unrestricted radius, user-adjustable. A hospital's public website, if available, is crawled to enrich scraped records with specialists/treatments/labs. |
| **Inputs** | • Hospital registration details • Facility list • Linked doctor/lab/pharmacy associations |
| **Outputs** | • Hospital profile with linked facilities and providers |
| **Dependencies** | M4 Doctor Management, M7 Lab Management, M6 Pharmacy Management, M11 Scraper Engine. |
| **Open Notes** | The "no default distance cap" behavior for hospitals is notably different from the distance-limited default used for pharmacies — flagged for stakeholder confirmation in Section 8. |

## **  M6 — Pharmacy Management**

*Pharmacy profiles, inventory, and pricing for both scraped and platform-linked pharmacies.*

### **M6.1 Functional Requirements**

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| **FR-PHARM-01** | The system shall allow Pharmacy Admins to register a pharmacy profile. | **High** |
| **FR-PHARM-02** | The system shall allow linked pharmacies to sync inventory (items, pricing, stock units) on a regular schedule via integration with the pharmacy's POS system. | **High** |
| **FR-PHARM-03** | The system shall allow Pharmacy Admins to manage inventory manually through a pharmacy dashboard, in addition to POS sync. | **High** |
| **FR-PHARM-04** | The system shall store scraped (unregistered) pharmacy records within a configurable radius of the user's location, capturing name, phone number, operating hours, and coordinates. | **High** |
| **FR-PHARM-05** | The system shall allow the User to increase the default search radius for pharmacies. | **Medium** |

### **M6.2 Detailed Specification**

| **Description** | Manages pharmacy profiles, inventory, and pricing, for both scraped (unregistered) and platform-linked (registered) pharmacies. |
| --- | --- |
| **Actors** | Pharmacy Admin; User (consumer of inventory/availability); Super Admin/Admin. |
| **Business Rules** | Linked pharmacies push inventory via POS sync on a regular cadence, with manual dashboard entry also supported. Scraped pharmacies are limited to a default radius (assumed 5 km, pending confirmation) around the user, user-adjustable. |
| **Inputs** | • Pharmacy registration • POS feed or manual inventory entries |
| **Outputs** | • Pharmacy profile • Current inventory and pricing • Scraped nearby-pharmacy listings |
| **Dependencies** | M11 Scraper Engine, M2 AI Symptom Checker (recommendation target). |
| **Open Notes** | POS vendor(s) and sync protocol/frequency were left open ("apply any approach for sync"). Recommend an adapter-pattern integration layer — see NFR-INTEROP-01. |

## **  M7 — Lab Management**

*Lab profiles, test catalogues, pricing/wait times, and report delivery into the patient portal.*

### **M7.1 Functional Requirements**

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| **FR-LAB-01** | The system shall allow Labs Admins to register a lab profile including certification details and services offered. | **High** |
| **FR-LAB-02** | The system shall allow registered Labs to manage test availability, pricing, and estimated wait times. | **High** |
| **FR-LAB-03** | The system shall allow registered Labs to upload test report details against a specific registered patient's ID, making the report accessible via that patient's Patient Portal. | **High** |
| **FR-LAB-04** | The system shall store scraped (unregistered) lab records capturing hours of availability, contact information, certification status, and services offered. | **High** |
| **FR-LAB-05** | Unregistered labs shall not require any onboarding step to appear as a scraped/suggested listing. | **Medium** |

### **M7.2 Detailed Specification**

| **Description** | Manages lab profiles, test catalogues, pricing and wait times, and delivery of test reports into a patient's portal. |
| --- | --- |
| **Actors** | Labs Admin; User; Doctor (may refer a test); Super Admin/Admin. |
| **Business Rules** | Registered labs manage their own test availability, pricing, and wait time. Report-to-patient association is by patient ID. |
| **Inputs** | • Lab registration and certification info • Test catalogue • Report uploads |
| **Outputs** | • Lab profile • Bookable test list • Patient-linked reports |
| **Dependencies** | M10 Patient Portal, M11 Scraper Engine, M3 Specialty AI Agents (referral target). |
| **Open Notes** | None beyond the general scraper-related items already flagged in Section 8. |

## **  M8 — Appointment Booking**

*Discovery and booking of time with registered doctors, and the resulting schedule management.*

### **M8.1 Functional Requirements**

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| **FR-APPT-01** | The system shall allow Users to search and browse doctors by specialty, availability, and proximity. | **High** |
| **FR-APPT-02** | The system shall allow Users to book an appointment with a Medicio-registered doctor based on the doctor's published availability. | **High** |
| **FR-APPT-03** | The system shall allow Doctors to accept, reschedule, or cancel appointment requests. | **High** |
| **FR-APPT-04** | The system shall notify both User and Doctor of appointment status changes (confirmation, reschedule, cancellation). | **Medium** |
| **FR-APPT-05** | The system shall maintain an appointment history accessible from the User's Patient Portal and the Doctor's dashboard. | **Medium** |

### **M8.2 Detailed Specification**

| **Description** | Lets patients discover and book time with Medicio-registered doctors, and lets doctors manage the resulting schedule. |
| --- | --- |
| **Actors** | User; Doctor; Hospital Admin (oversight). |
| **Business Rules** | Booking is limited to registered doctors' published availability. Doctors can accept, reschedule, or cancel a request. |
| **Inputs** | • Doctor search/filter criteria • Booking request • Status changes |
| **Outputs** | • Confirmed/updated appointment record • Notifications • Appointment history |
| **Dependencies** | M4 Doctor Management, M1 IAM/RBAC, M10 Patient Portal. |
| **Open Notes** | Notification channel (SMS/email/push) is not specified in the notes — flagged in Section 8. |

## **  M9 — Medicine Tracker**

*Patient medicine logging that feeds the AI Symptom Checker**'**s intake questions.*

### **M9.1 Functional Requirements**

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| **FR-MED-01** | The system shall allow Users to log medicines they are currently taking, including dosage and schedule. | **Medium** |
| **FR-MED-02** | The system shall allow Users to view their medicine history over time. | **Medium** |
| **FR-MED-03** | The system shall make medicine-tracker data available as input context to the AI Symptom Checker's "medicines used before" intake question. | **High** |
| **FR-MED-04** | The system should provide reminders/notifications for scheduled doses. | **Low** |

### **M9.2 Detailed Specification**

| **Description** | Lets patients log and review medicines they are taking, and feeds that history back into the AI Symptom Checker's intake questions. |
| --- | --- |
| **Actors** | User. |
| **Business Rules** | Tracker entries are treated as part of the "medicines used before" intake signal required by M2. |
| **Inputs** | • Medicine name, dosage, schedule |
| **Outputs** | • Medicine history • Intake pre-fill for the AI checker |
| **Dependencies** | M2 AI Symptom Checker, M10 Patient Portal. |
| **Open Notes** | The notes only say "Medicine tracker" — field-level detail (dosage/schedule/reminders) is an architect-level elaboration pending confirmation. |

## **  M10 — Patient Portal ****&**** Health Records**

*A consolidated, patient-owned view of reports, medicine history, appointments, and AI consultation history.*

### **M10.1 Functional Requirements**

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| **FR-PORTAL-01** | The system shall provide each User with a centralized Patient Portal consolidating lab reports, medicine history, appointment history, and AI consultation history. | **High** |
| **FR-PORTAL-02** | The system shall associate lab-uploaded reports with the correct patient record via patient ID matching. | **High** |
| **FR-PORTAL-03** | The system shall restrict access to a patient's portal data to that patient and explicitly authorized healthcare professionals. | **High** |

### **M10.2 Detailed Specification**

| **Description** | A consolidated, patient-owned view of lab reports, medicine history, appointment history, and AI/agent consultation history. |
| --- | --- |
| **Actors** | User; Labs Admin (writes reports); Super Admin (support access). |
| **Business Rules** | Report-to-patient association is by patient ID; access is restricted to the patient and explicitly authorized professionals. |
| **Inputs** | • Data written by M7 (reports), M8 (appointments), M9 (medicine log), M2/M3 (AI history) |
| **Outputs** | • Unified patient record view |
| **Dependencies** | M1 IAM/RBAC, M7, M8, M9, M2, M3. |
| **Open Notes** | None additional. |

## **  M11 — Data Aggregation ****&**** Scraper Engine**

*Super-Admin-only aggregation of doctor/hospital/pharmacy/lab data from public sources, deduplicated against verified records.*

### **M11.1 Functional Requirements**

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| **FR-SCRAPE-01** | The system shall provide a dedicated scraper component for each entity type: Doctor, Hospital, Pharmacy, and Lab. | **High** |
| **FR-SCRAPE-02** | Scrapers shall source data from Facebook, Google Maps, and other public listing sites. | **High** |
| **FR-SCRAPE-03** | The Doctor scraper shall capture, at minimum, location, name, specialty, and availability. | **High** |
| **FR-SCRAPE-04** | The system shall restrict scraper configuration, execution, and raw scraped-data access to the Super Admin/developer role only. | **High** |
| **FR-SCRAPE-05** | The system shall tag all scraped records as scraped/suggested and visually distinguish them from Medicio-verified records in every user-facing view. | **High** |
| **FR-SCRAPE-06** | The system shall deduplicate incoming scraped data against existing verified records; where a conflict exists, the verified record shall take precedence. | **High** |
| **FR-SCRAPE-07** | The system shall re-run scraper jobs on a scheduled, configurable interval to keep unregistered listings reasonably current. | **Low** |

### **M11.2 Detailed Specification**

| **Description** | A private, Super-Admin-only subsystem that scrapes doctor, hospital, pharmacy, and lab data from public sources, deduplicates it against verified records, and tags it clearly as unverified. |
| --- | --- |
| **Actors** | Super Admin / Developer only. |
| **Business Rules** | One dedicated scraper per entity type. Verified/registered data always takes precedence over scraped data in conflicts. Every scraped record is tagged so it is visibly distinguishable from verified records wherever it is surfaced. |
| **Inputs** | • Public source data: Facebook, Google Maps, listing sites, hospital websites |
| **Outputs** | • Tagged, deduplicated scraped records feeding M4–M7 fallback listings |
| **Dependencies** | Feeds M4, M5, M6, M7; access governed by M1 (Super-Admin-only). |
| **Open Notes** | Scraping Facebook and Google Maps data may conflict with those platforms' Terms of Service. Recommend legal review and evaluating official APIs (e.g., a maps places API) as a lower-risk alternative or supplement — see Section 8. |

## **  M12 — Analytics, Logging ****&**** Monitoring**

*Full audit trail of user actions plus PostHog product analytics, visible only to Super Admin.*

### **M12.1 Functional Requirements**

| **ID** | **Requirement** | **Priority** |
| --- | --- | --- |
| **FR-LOG-01** | The system shall log every user action with sufficient detail to reconstruct the action's functionality and outcome. | **High** |
| **FR-LOG-02** | Access to system logs shall be restricted to the Super Admin role only. | **High** |
| **FR-LOG-03** | The system shall integrate PostHog for full product analytics, including event tracking across all major user flows. | **High** |
| **FR-LOG-04** | The system shall provide the Super Admin a dashboard view of aggregated logs and analytics. | **Medium** |

### **M12.2 Detailed Specification**

| **Description** | Captures a full audit trail of user actions and integrates PostHog for product analytics, visible only to the Super Admin. |
| --- | --- |
| **Actors** | Super Admin. |
| **Business Rules** | Every user action is logged with enough detail to reconstruct what happened and its outcome; logs are Super-Admin-only; PostHog covers all major flows. |
| **Inputs** | • Application events from every module |
| **Outputs** | • Audit log store • PostHog event stream • Super Admin analytics dashboard |
| **Dependencies** | Receives events from all modules (M1–M11). |
| **Open Notes** | None additional. |

# **5. Non-Functional Requirements**

Non-functional requirements are grouped by quality attribute. Each carries an NFR-CATEGORY-## identifier for traceability against architecture and test plans.

### **5.1 Performance**

| **ID** | **Requirement** |
| --- | --- |
| NFR-PERF-01 | AI Symptom Checker responses should return within an interactive latency target (e.g., under ~5 seconds for a typical query) to preserve conversational usability. |
| NFR-PERF-02 | Location-based search (doctors/pharmacies/labs) shall return results within 2–3 seconds under normal load. |
| NFR-PERF-03 | Scraper jobs shall run as asynchronous background processes and shall not degrade front-end responsiveness for concurrent users. |

### **5.2 Scalability**

| **ID** | **Requirement** |
| --- | --- |
| NFR-SCALE-01 | The architecture shall support horizontal scaling of API services independent of the scraper and AI-agent subsystems. |
| NFR-SCALE-02 | The data layer shall handle growth in scraped-entity volume without significant query degradation, including geospatial indexing for radius queries. |
| NFR-SCALE-03 | The Specialty AI Agent framework shall be extensible to new specialties without architectural change. |

### **5.3 Security ****&**** Privacy**

| **ID** | **Requirement** |
| --- | --- |
| NFR-SEC-01 | All patient health data shall be encrypted in transit (TLS) and at rest. |
| NFR-SEC-02 | RBAC checks shall be enforced server-side on every API endpoint, not solely in the client UI. |
| NFR-SEC-03 | Access to raw scraped data and system logs shall be restricted to Super Admin, per FR-SCRAPE-04 and FR-LOG-02. |
| NFR-SEC-04 | Doctor credential/verification documents shall be stored securely with access limited to the verification workflow and relevant administrators. |
| NFR-SEC-05 | The system shall obtain explicit user consent before accessing device geolocation. |

### **5.4 Reliability ****&**** Availability**

| **ID** | **Requirement** |
| --- | --- |
| NFR-REL-01 | Core patient-facing services (symptom checker, appointment booking) should target high availability (e.g., 99.5%+ uptime) given the health-related nature of the platform. |
| NFR-REL-02 | The system shall degrade gracefully if the LLM provider is unavailable (e.g., queued retry or a clear service-status message) rather than fail silently. |

### **5.5 Usability ****&**** Accessibility**

| **ID** | **Requirement** |
| --- | --- |
| NFR-USE-01 | Role-specific dashboards shall present only the functionality relevant to that role. |
| NFR-USE-02 | The symptom-intake flow shall be a guided, step-by-step conversational flow rather than a single long form. |
| NFR-USE-03 | The interface should target WCAG 2.1 AA accessibility, given the health-related, potentially vulnerable user base. |

### **5.6 Maintainability ****&**** Extensibility**

| **ID** | **Requirement** |
| --- | --- |
| NFR-MAINT-01 | Each module (Doctor, Hospital, Pharmacy, Lab, Scraper) shall be implemented with clear separation of concerns to allow independent development and deployment. |
| NFR-MAINT-02 | The scraper subsystem shall support adding a new data source without modifying existing scraper implementations (adapter pattern). |

### **5.7 Compliance ****&**** Legal**

| **ID** | **Requirement** |
| --- | --- |
| NFR-COMP-01 | The platform shall display a clear medical disclaimer stating that AI-generated guidance does not constitute a diagnosis and does not replace a licensed medical professional. |
| NFR-COMP-02 | The platform shall comply with applicable data-protection regulation governing health data in its operating jurisdiction; pending legal confirmation, GDPR-style consent and data-minimization principles are recommended as an interim baseline. |
| NFR-COMP-03 | The system shall retain an auditable log of AI-generated medical suggestions for accountability and dispute resolution. |

### **5.8 Data Integrity**

| **ID** | **Requirement** |
| --- | --- |
| NFR-DATA-01 | The deduplication engine shall apply a documented, deterministic conflict-resolution rule (verified data over scraped data), per FR-SCRAPE-06. |
| NFR-DATA-02 | The system shall timestamp/version scraped records so data freshness can be determined when the same entity is scraped from multiple sources. |

### **5.9 Interoperability**

| **ID** | **Requirement** |
| --- | --- |
| NFR-INTEROP-01 | The Pharmacy POS integration layer shall be designed against a common internal data contract, with adapters per POS vendor, so new POS systems can be onboarded without redesigning the core inventory model. |
| NFR-INTEROP-02 | The system shall expose/consume APIs using standard formats (REST/JSON) to support future integration with external hospital information systems. |

# **6. Role-Based Access Control (RBAC) Matrix**

The matrix below summarizes feature-level access per role, consistent with the RBAC rules defined in Module M1 (FR-IAM-02 through FR-IAM-05). Super Admin retains full access across the platform, including the Custom Role mechanism (FR-IAM-04), and is therefore the implicit superset for any role not explicitly listed.

| **Feature / Module** | **Super Admin** | **Admin/ Manager** | **Doctor** | **Hospital Admin** | **Labs Admin** | **Pharmacy Admin** | **User** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AI Symptom Checker (use) | V | V | V | — | — | — | F |
| Specialty AI Agents (use / train) | V | V | O (train) | — | — | — | F (use) |
| Appointment Booking (as patient) | — | — | — | — | — | — | F |
| Appointment Management (as provider) | V | V | O | O (hospital drs.) | — | — | O (own) |
| Medicine Tracker | V | — | — | — | — | — | F (own) |
| Patient Portal / Health Records | V | — | V (assigned) | — | V (own labs) | — | F (own) |
| Doctor Profile Management | F | F | O | O (affiliated) | — | — | — |
| Hospital Profile Management | F | F | — | O | — | — | — |
| Pharmacy Profile & Inventory | F | F | — | — | — | O | — |
| Lab Profile & Test Management | F | F | — | — | O | — | — |
| Doctor Credential Verification | F | F | — | — | — | — | — |
| Scraper Config & Raw Scraped Data | F | — | — | — | — | — | — |
| System Logs | F | — | — | — | — | — | — |
| Analytics Dashboard (PostHog) | F | V | — | — | — | — | — |
| Custom Role Definition | F | — | — | — | — | — | — |

*F = Full access   ·   O = Own / scoped records only   ·   V = View only   ·   — = No access*

# **7. Conceptual Data Model**

The table below lists the core conceptual entities implied by the functional requirements, ahead of formal schema/ERD design. It is intended to seed data-modeling discussions, not to prescribe a final schema.

| **Entity** | **Description** | **Key Relationships** |
| --- | --- | --- |
| User | A patient/consumer account. | Has Appointments, MedicineTrackerEntries, AI/Agent history; owns a Patient Portal. |
| Role / Permission | Defines access rights (predefined or custom). | Assigned to one or more accounts. |
| Doctor | A verified, registered medical practitioner. | Optionally affiliated with a Hospital; has Availability, Appointments; trains a Specialty AI Agent. |
| Hospital | A verified, registered healthcare facility. | Has many affiliated Doctors, Labs, Pharmacies. |
| Pharmacy | A verified, registered pharmacy/medical store. | Has InventoryItems; optionally affiliated with a Hospital. |
| Lab | A verified, registered diagnostic lab. | Has a test catalogue; produces LabReports for Users. |
| ScrapedRecord | An unverified record (Doctor/Hospital/Pharmacy/Lab subtype) from the Scraper Engine. | Deduplicated against verified entities of the same type. |
| Appointment | A booking between a User and a Doctor. | References User, Doctor, status and time. |
| MedicineTrackerEntry | A medicine a User reports taking. | References User; feeds the AI Symptom Checker intake. |
| LabReport | A diagnostic result uploaded by a Lab. | References Lab and User (patient ID match). |
| AIConsultation | A symptom-checker session log. | References User; stores intake answers and output recommendation. |
| AgentConversation | A conversation with a Specialty AI Agent. | References User and the bound Doctor/Hospital/Lab or specialty. |
| InventoryItem | A pharmacy stock item with pricing. | References Pharmacy. |
| AuditLog | A record of a user action for traceability. | References the acting user/role and affected entity. |
| AnalyticsEvent | A PostHog-tracked product event. | References User (where applicable) and event metadata. |

# **8. Assumptions, Open Questions ****&**** Risks**

The original requirements-gathering notes were, in places, informal or ambiguous. The items below record every point where this specification made an interpretive judgment call, and flags it for stakeholder confirmation before implementation begins.

| **Topic** | **Ambiguity / Note** | **Assumption / Recommendation** |
| --- | --- | --- |
| Authentication method | Meeting notes do not specify sign-up/sign-in mechanism. | Assumed standard email/password (FR-IAM-01); confirm if social/OAuth login is also required. |
| Pharmacy search radius | Notes state a radius that is likely a shorthand/typo ("SKM"). | Interpreted as a default 5 km radius, user-adjustable (FR-PHARM-04). Confirm the intended default. |
| Hospital search radius | Notes specify "0km radius" for hospitals, unlike the distance-limited pharmacy default. | Interpreted as no default distance cap for hospitals (FR-HOSP-05). Confirm this is intentional and not a note-taking shorthand. |
| Pharmacy POS integration | Notes say "apply any approach for sync for their POS" without naming vendors or a protocol. | Recommend an adapter-per-vendor middleware layer (NFR-INTEROP-01); specific POS vendors and sync frequency need confirmation. |
| Medicine Tracker detail | Notes only say "Medicine tracker" with no field-level detail. | Elaborated to include dosage, schedule, and history (FR-MED-01/02) as a reasonable baseline; validate against actual patient needs. |
| Notification channel | No channel specified for appointment or dose reminders. | Flagged as an open decision (SMS vs. email vs. push) for FR-APPT-04 and FR-MED-04. |
| Scraping Facebook / Google Maps | Notes call for scraping these platforms directly. | This may conflict with those platforms' Terms of Service. Recommend legal review and evaluating official APIs (e.g., a maps places API) as a lower-risk alternative or supplement. |
| Health-data compliance regime | No specific regulatory framework named. | Recommend confirming the applicable data-protection regime with legal counsel, using GDPR-style principles as an interim baseline (NFR-COMP-02). |
| Doctor credential verification workflow | Notes state certification is required but not the review process. | Needs a defined workflow: required documents, reviewer role, and turnaround SLA. |
| Scraper run frequency | Not specified in notes. | Recommend a configurable schedule (FR-SCRAPE-07), to be tuned post-launch based on data-freshness needs. |
| Custom role granularity | "Custom role with custom authorizations" is not further defined. | Needs a decision on whether permissions are screen-level, action-level, or data-level. |

# **9. Traceability Matrix**

Maps the original requirements-session note groupings to the refined SRS modules defined in this document, to support review by stakeholders who attended the original session.

| **Raw Note Grouping** | **SRS Module(s)** |
| --- | --- |
| Dashboard & Analytics → AI Dashboard | M2 AI Symptom Checker & Recommendation Engine; M3 Specialty AI Agents |
| Dashboard & Analytics → Logs and analytics | M12 Analytics, Logging & Monitoring |
| Tracking & Appointments → Medicine tracker | M9 Medicine Tracker |
| Tracking & Appointments → Appointments booking | M8 Appointment Booking |
| Integrations & Linking → Pharmacies, hospitals, labs scraper | M11 Data Aggregation & Scraper Engine |
| Integrations & Linking → Pharmacies linking | M6 Pharmacy Management |
| Integrations & Linking → Hospital linking | M5 Hospital Management |
| Integrations & Linking → Labs integration | M7 Lab Management |
| Implicit in RBAC / roles notes | M1 Authentication & Access Control |
| Implicit in detailed doctor notes | M4 Doctor Management |
| Implicit in "patient portal" references | M10 Patient Portal & Health Records |

# **10. Approval**

This document is submitted for stakeholder review. Approval below signifies agreement with the module breakdown, functional and non-functional requirements, RBAC matrix, and the assumptions recorded in Section 8, pending resolution of the open items listed therein.

| **Name** | **Role** | **Signature** | **Date** |
| --- | --- | --- | --- |
|  | Product Owner |  |  |
|  | Engineering Lead |  |  |
|  | QA Lead |  |  |

Page  of