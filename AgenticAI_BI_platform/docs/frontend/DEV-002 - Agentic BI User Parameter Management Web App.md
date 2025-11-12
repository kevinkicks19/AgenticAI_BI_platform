---
status: draft
version: 3
last_modified: 2025-05-22T12:00:00Z
---

# DEV-002 - Agentic BI User Parameter Management Web App

## Description  
As a Solution Architect or Product Owner,  
I want to manage conceptual business things, workflows, and external configuration parameters within a web app,  
So that I can maintain inception documents, business concepts, stories, issues, user personas, storage parameters, credentials, and other defined entities in a unified, extensible interface aligned with our BI system lifecycle and LLM coaching capabilities.

## Acceptance Criteria  
- The web app supports user login and secure access, with persona or role assignment (i.e. Solution Architect) for a given session.
- The app displays a catalog (left-hand menu) of conceptual types (e.g., domains, business concepts, stories, issues, users, personas, storage configuration).  
- Selecting a conceptual type lists all entities of that type, sourced from folders where each file represents an entity (e.g., markdown documents).  
- Users can select an entity to open a canvas-style editor enabling direct edits and LLM-assisted modifications.  
- Changes to conceptual entities and external configuration parameters (users, personas, storage credentials) are persisted back to their markdown files or integrated storage (e.g., Data Hub) as metadata updates.  
- The system is extensible to add new conceptual entity types, external configuration parameters, and workflows.  
- The web app provides an interface for managing workflows around lifecycle maintenance of these entities (e.g., inception document updates, business concept definitions, user permission updates).  
- The web app integrates LLM coaching to assist users in editing and managing conceptual entities, external configurations, and workflows.  
- The interface reads and leverages vectorized information representing conceptual entities and stories from long-term persistence.  
- The UI supports native markdown editing initially, with potential future integration to services like Data Hub for native lifecycle management.  
- The app works responsively across desktop and mobile browsers.  
- The webapp must include a persistent long-term memory that is materialized as a pineconde vector store as the same name as the project/repo
- The webapp will open the vector stores for dvkv and the host repositoty project name and initiate a chat with the user using those vector stores as context.
- The webapp must include a facility to 'import' content into the vector database, either by an workflow execute button that launches the loading of the github report, or by picking a file that is then loaded into the repo and added to the vector store.

## Metadata  
| Revision | Date                | Owner          | Changes                                             |  
|----------|---------------------|----------------|-----------------------------------------------------|  
| 1        | 2025-05-21T19:36:19Z| Bruce McCartney| Initial draft created                               |  
| 2        | 2025-05-22TXX:XX:XXZ| Bruce McCartney| Revised to include conceptual entity management, workflows, LLM coaching |  
| 3        | 2025-05-22T12:00:00Z| Bruce McCartney| Added external configuration parameters (users, personas, credentials) to story and acceptance criteria |
