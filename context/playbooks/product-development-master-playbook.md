# Product Development Master Playbook
## AI-Assisted Product Engineering Lifecycle for Small → Large Applications

**Version:** 1.0  
**Status:** Living engineering/product-development playbook  
**Last reviewed:** 2026-10-07

> This document is a practical product-engineering operating system. It combines discovery, product definition, user stories, architecture, schema/API design, AI/agent tooling, implementation, testing, security, deployment, operations, and continuous improvement. It is a synthesis, not a replacement for any single methodology.

---

# 1. The Core Idea

Do not go directly from:

```text
Idea → Code
```

Use:

```text
Raw request
  ↓
Requirement extraction
  ↓
Diverge
  ↓
Deep dive
  ↓
Personas + workflows
  ↓
Product Goal + scope
  ↓
Epics / capabilities
  ↓
User stories
  ↓
Acceptance criteria
  ↓
Definition of Ready
  ↓
Domain model
  ↓
Architecture
  ↓
Schema / data ownership
  ↓
API contracts
  ↓
Security / threat model
  ↓
AI / MCP / playbook design
  ↓
Implementation plan
  ↓
Tests
  ↓
Vertical implementation slices
  ↓
Evaluation
  ↓
Deployment
  ↓
Observe
  ↓
Learn
  ↓
Improve
```

The loop is continuous. Product Backlog items and product decisions should evolve as evidence changes. Scrum itself is intentionally incomplete and expects context-specific supporting practices. citeturn238509search5turn238509search70

---

# 2. Operating Principles

## 2.1 Evidence before confidence

For important statements, label them:

- **FACT** — verified.
- **OBSERVATION** — directly observed in users, logs, code, tests, or data.
- **ASSUMPTION** — believed but not verified.
- **HYPOTHESIS** — proposed explanation or expected behavior.
- **CONSTRAINT** — something the solution must satisfy.
- **DECISION** — chosen approach.
- **RISK** — uncertainty with material impact.
- **UNKNOWN** — information that must be obtained.

Never silently turn an assumption into a requirement.

## 2.2 Prefer the simplest architecture that satisfies the constraints

Large systems do not automatically require microservices. Start with a modular structure and introduce distribution when domain, scale, team, security, availability, or deployment constraints justify it.

Microsoft architecture guidance emphasizes bounded contexts, data ownership, loose coupling, and evolutionary boundary decisions rather than service count for its own sake. citeturn355040search0turn355040search9turn355040search11

## 2.3 Build vertical slices

Prefer:

```text
User outcome
→ data
→ API
→ backend/domain logic
→ UI
→ tests
→ demoable increment
```

over building entire technical layers in isolation. Frequent integration and automated verification reduce integration risk. citeturn377640search16

## 2.4 Quality is multidimensional

Review systems against relevant dimensions including:

```text
Functionality
Security
Reliability
Performance
Cost
Operability
Maintainability
UX
Accessibility
AI quality
```

AWS Well-Architected provides a useful baseline across operational excellence, security, reliability, performance efficiency, cost optimization, and sustainability. citeturn377640search0turn377640search4

## 2.5 Keep the process living

The Definition of Done and engineering playbook should change when evidence shows the process is insufficient. Atlassian explicitly describes the DoD as a living document that can be revised as the team learns. citeturn168926search8

---

# 3. Universal Stage Contract

Every stage must follow:

```text
INPUT
 ↓
QUESTIONS
 ↓
ANALYSIS
 ↓
DECISIONS
 ↓
ARTIFACT
 ↓
REVIEW
 ↓
EXIT CRITERIA
 ↓
OUTPUT FOR NEXT STAGE
```

A stage is not complete because a document was written. It is complete when its output is good enough to support the next decision.

---

# 4. Stage 0 — Intake & Requirement Extraction

## Goal

Convert unstructured input into a structured requirement package without prematurely designing the solution.

Possible inputs:

- Client/user request
- Meeting notes
- Existing app
- Source code
- Screenshots
- Support tickets
- Existing APIs
- Business documents
- Data sets
- User feedback

## Required output

```text
Problem
Desired outcome
Users
User goals
Functional requirements
Non-functional requirements
Business rules
Data requirements
Integration requirements
Security/privacy constraints
Operational constraints
Dependencies
Assumptions
Unknowns
Risks
Open questions
Evidence
```

## Master Prompt

```text
You are a Principal Product Manager, Business Analyst, UX Researcher,
Solutions Architect, and Senior Software Engineer.

Raw product information:
[PASTE INPUT]

Do NOT design the final solution yet.

Extract and normalize:
1. Problem
2. Desired business/user outcome
3. Primary users
4. Secondary users
5. Jobs-to-be-done
6. Existing workflow
7. Pain points
8. Functional requirements
9. Non-functional requirements
10. Business rules
11. Data requirements
12. Integrations
13. Security/privacy requirements
14. Performance/reliability requirements
15. Operational requirements
16. Constraints
17. Dependencies
18. Assumptions
19. Unknowns
20. Risks
21. Open questions
22. Evidence

For every major requirement provide:
- ID
- Description
- Type
- Priority
- Confidence
- Source/evidence
- Dependencies
- Validation method

Separate FACTS, OBSERVATIONS, ASSUMPTIONS, HYPOTHESES, and UNKNOWNs.
Never invent missing facts. Mark missing information as UNKNOWN.

End with:
A. Confirmed requirements
B. Assumptions
C. Unknowns
D. Questions blocking further product definition
E. Recommended next stage
```

---

# 5. Stage 1 — Diverge

## Goal

Explore multiple possible problem interpretations and solutions before commitment.

Cover:

- User segments
- Jobs-to-be-done
- Existing workarounds
- Alternative products
- Manual solutions
- AI solutions
- Non-AI solutions
- Build vs buy
- Automation levels
- Business opportunities
- Technical directions
- Risks and unknowns

Generate genuinely different directions, not five variations of the same feature.

## Master Prompt

```text
You are a senior product strategist, UX researcher, domain expert,
and software architect.

Inputs:
[STAGE 0 OUTPUT]

Do NOT finalize the product yet.

DIVERGE across the problem space.

Analyze:
1. Problem interpretations
2. User segments
3. Jobs-to-be-done
4. Existing alternatives
5. Manual workarounds
6. Non-AI approaches
7. AI-assisted approaches
8. Full automation approaches
9. Technical approaches
10. Business models
11. Data needs
12. Security/privacy risks
13. Cost drivers
14. Failure scenarios

Generate at least 5 substantially different solution directions.
For each provide:
- Target user
- Problem
- Outcome
- Workflow
- Main capability
- Differentiator
- Complexity
- Cost
- Risks
- Validation method
- Why it may fail

Compare all directions and select a recommendation only after evaluating alternatives.
End with assumptions that must be validated before commitment.
```

---

# 6. Stage 2 — Deep Dive

## Goal

Understand the specific product/domain deeply enough to define it responsibly.

Research:

```text
Domain
Users
Current workflow
Competitors/alternatives
Business rules
Data
Integrations
Technical feasibility
Security
Privacy
Compliance
Performance
Reliability
Scalability
Cost
```

Prefer primary/official documentation and first-hand evidence for critical decisions.

## Master Prompt

```text
You are a senior domain researcher, product manager, solutions architect,
security reviewer, and engineering lead.

Selected direction:
[STAGE 1 OUTPUT]

Perform a DEEP DIVE.

Analyze:
1. Domain model
2. User workflows
3. Existing solutions
4. Competitive landscape
5. Pain points
6. Business rules
7. Data requirements
8. Functional requirements
9. Non-functional requirements
10. Integrations
11. Security
12. Privacy
13. Compliance
14. Reliability
15. Performance
16. Scalability
17. Cost
18. AI feasibility
19. Operational risks
20. Technical risks

Separate facts, observations, assumptions, hypotheses, decisions, and unknowns.

Produce:
- Domain glossary
- Current-state workflow
- Future-state workflow
- Requirement inventory
- Risk register
- Validation backlog
- Product-design inputs

Do not write production code and do not lock technology choices without evidence.
```

---

# 7. Stage 3 — Persona & Workflow Builder

## Goal

Model who acts, why, what they need, and what the system must do during each journey.

## Persona template

```text
Persona ID
Role
Context
Goals
Jobs-to-be-done
Pain points
Motivations
Frustrations
Technical proficiency
Frequency of use
Permissions
Visible data
Allowed actions
Success criteria
Failure scenarios
```

## Workflow template

```text
Trigger
Actor
Preconditions
User actions
System actions
Decision points
Data created/changed
External dependencies
Expected outcome
Failure path
Recovery
Security-sensitive actions
```

## Master Prompt

```text
You are a senior UX researcher and product designer.

Inputs:
[DEEP DIVE]
[DOMAIN GLOSSARY]
[CURRENT WORKFLOWS]

Build the persona and workflow model.

Identify:
- Primary personas
- Secondary personas
- Admin/operator personas
- External actors
- Automated/system actors

For each persona define role, context, goals, jobs-to-be-done,
pain points, motivations, technical ability, permissions, data access,
critical actions, and success criteria.

Map:
Persona → Journey → User Goal → Product Capability → Outcome

For each journey identify trigger, preconditions, main path, alternate paths,
failure paths, recovery, data changes, external dependencies, and security concerns.

Mark MVP-critical journeys.
Do not invent users without evidence or a clearly labeled assumption.
```

---

# 8. Stage 4 — Product Definition & Scope

## Goal

Define a product with a measurable purpose and a deliberately limited first release.

Define:

```text
Product Vision
Product Goal
Problem Statement
Value Proposition
Target Users
Core Journeys
MVP
V1
Future Roadmap
Out of Scope
Success Metrics
Constraints
Risks
```

Scrum's Product Goal is a useful model for expressing a future state that gives the backlog a coherent target. citeturn238509search2

## Scope rule

Every feature must answer:

```text
Who needs it?
What problem does it solve?
What outcome/value does it create?
Why now?
What happens if we do not build it?
What dependency and operational cost does it add?
```

## Master Prompt

```text
You are a senior product manager responsible for strategy and scope.

Inputs:
[DEEP DIVE]
[PERSONAS]
[USER JOURNEYS]

Define:
1. Product vision
2. Product Goal
3. Problem statement
4. Value proposition
5. Target users
6. Core journeys
7. MVP scope
8. V1 scope
9. Future roadmap
10. Explicit out-of-scope items
11. Functional requirements
12. Non-functional requirements
13. Business rules
14. Success metrics
15. Constraints
16. Product risks

Prioritize using user value, business value, confidence, complexity, risk,
dependencies, and time to validate.

End with a FROZEN MVP and a list of deferred items.
```

---

# 9. Stage 5 — Epics, Capabilities & Feature Map

Use:

```text
Product Goal
  ↓
Initiative / Outcome
  ↓
Epic / Capability
  ↓
Feature
  ↓
User Story
  ↓
Implementation Task
```

A technical task is not automatically a user story.

Bad:

```text
As a developer, I want a PostgreSQL table for candidates.
```

Better:

```text
As a recruiter,
I want to save a candidate profile,
so that I can review the candidate later without re-entering information.
```

The table, API, validation, and UI are implementation tasks supporting that outcome.

---

# 10. Stage 6 — User Stories: How They Should Be Done

## 10.1 What a user story is

A user story is a concise, user-focused statement of a desired outcome. It is intentionally lighter than a giant requirements document; the detailed agreement is created through conversation and confirmation. Atlassian describes the common structure as persona + need + purpose and the 3 Cs as Card, Conversation, and Confirmation. Agile Alliance similarly emphasizes user goals, acceptance criteria, and the ability to assess/split stories using INVEST. citeturn168926search0turn377640search14

Common form:

```text
As a [persona],
I want [goal],
so that [benefit].
```

## 10.2 INVEST

```text
I — Independent
N — Negotiable
V — Valuable
E — Estimable
S — Small
T — Testable
```

INVEST is a widely used checklist for story quality. citeturn377640search6

## 10.3 User-story lifecycle

```text
Business outcome
→ Epic/capability
→ Candidate story
→ Clarification conversation
→ Acceptance criteria
→ Edge/failure cases
→ Dependencies
→ Size/estimate
→ Definition of Ready
→ Implementation
→ Tests
→ Review
→ Acceptance
→ Definition of Done
→ Release / increment
```

## 10.4 Step-by-step story creation

### Step 1 — Identify the actor

Who is actually performing the action?

Do not use a generic "user" when a meaningful role exists.

### Step 2 — Identify the intent

Express what the actor wants to accomplish, not the UI component or technology.

Bad:

```text
I want a React dropdown.
```

Better:

```text
I want to filter results by status so that I can find relevant records quickly.
```

### Step 3 — Identify the outcome/value

Why does the action matter?

### Step 4 — Bound the scope

Record what is intentionally excluded.

### Step 5 — Define acceptance criteria

State observable behavior.

### Step 6 — Cover edge and failure behavior

Ask what happens with:

```text
Invalid input
Missing data
Permission denied
Duplicate submission
Timeout
Dependency outage
Concurrency
Partial failure
Retry
```

### Step 7 — Identify dependencies

Examples:

```text
Authentication
Database entity
API contract
Previous story
External service
Feature flag
Migration
AI model
```

### Step 8 — Estimate

Use the team's method: story points, T-shirt sizes, planning poker, or a bounded engineering spike.

### Step 9 — Make it testable

Every important acceptance criterion should be convertible into a concrete verification.

### Step 10 — Apply INVEST and Definition of Ready

If it fails, split or rewrite it.

### Step 11 — Implement as a vertical slice

Where practical, include data + backend + API + UI + tests in one demonstrable slice.

### Step 12 — Verify and accept

Acceptance criteria demonstrate story behavior; Definition of Done establishes the quality bar for completed work. Atlassian and Scrum distinguish story-level acceptance criteria from the broader Definition of Done. citeturn168926search8turn238509search2

---

# 11. User Story Template

```markdown
## US-XXX — [Short outcome title]

### User Story
As a [persona],
I want [goal],
so that [benefit].

### Problem / Context
[Why this exists.]

### Business / User Value
[Expected outcome.]

### Scope
#### Included
- ...
#### Excluded
- ...

### Preconditions
- ...

### Acceptance Criteria
#### AC-01 — [Name]
Given [context]
When [action]
Then [observable result]

#### AC-02 — [Name]
Given ...
When ...
Then ...

### Edge Cases
- ...

### Failure Cases
- ...

### Security / Permission Rules
- ...

### Data Impact
- Entities:
- Reads:
- Writes:
- Migration:

### API / Integration Impact
- Endpoint:
- External dependency:
- Contract:

### Observability
- Logs:
- Metrics:
- Alerts:
- Audit events:

### Non-Functional Requirements
- Performance:
- Reliability:
- Security:
- Accessibility:
- Cost:
- Compliance:

### Dependencies
- ...

### Estimate
[Team method]

### Definition of Done
- [ ] Implementation complete
- [ ] Acceptance criteria pass
- [ ] Tests added/updated
- [ ] Security verified
- [ ] Observability added
- [ ] Documentation updated
- [ ] Code review complete
- [ ] CI passes
- [ ] Deployable

### Evidence
[Research, design, user feedback, logs, tickets, or tests]
```

---

# 12. Good vs Bad User Stories

## Bad

```text
As a developer,
I want to create a FastAPI endpoint and PostgreSQL table,
so that candidate data can be stored.
```

Why it is weak:

- User value is unclear.
- Implementation is embedded.
- Behavior is not defined.
- It is closer to an engineering task than a user outcome.

## Better

```text
As a recruiter,
I want to save a candidate profile,
so that I can review the candidate later without re-entering information.
```

Technical work can then include:

```text
Create entity
Add migration
Implement API
Add authorization
Validate data
Build UI
Add tests
```

---

# 13. Story Splitting Patterns

Useful patterns include:

```text
Workflow step:
Create → Review → Submit → Approve

Business rule:
Basic submission → validation → duplicate handling

Permission:
User action → admin action

Data variation:
Single item → bulk item

Failure behavior:
Happy path → recoverable failure → retry

Complexity spike:
Investigate X → document evidence → decide
```

The goal is not to split by technical layer mechanically. Prefer independently valuable, vertical slices where feasible.

---

# 14. User Story Quality Gate

A story is READY when:

```text
[ ] Persona is known
[ ] User intent is clear
[ ] Value is clear
[ ] Scope is bounded
[ ] Acceptance criteria are testable
[ ] Edge cases are understood
[ ] Failure behavior is defined
[ ] Permissions are understood
[ ] Dependencies are known
[ ] Data impact is understood
[ ] Integration impact is understood
[ ] Relevant NFRs are recorded
[ ] Team can estimate it
[ ] INVEST passes
[ ] Major contradictions are resolved
```

Scrum describes backlog refinement as an ongoing activity that breaks down and further defines backlog items so they become more precise and can be selected with confidence. citeturn238509search2

---

# 15. Master Prompt — Generate User Stories

```text
You are a senior Product Manager, UX researcher, QA engineer,
and engineering lead.

Inputs:
[PRODUCT SCOPE]
[PERSONAS]
[USER JOURNEYS]
[BUSINESS RULES]

Convert the requirements into a story backlog.

For each story provide:
ID
Title
Persona
User Story
Problem
Business/User Value
Scope
Out of Scope
Preconditions
Acceptance Criteria
Edge Cases
Failure Cases
Permission Rules
Data Impact
Integration Impact
Observability
Security Requirements
Relevant NFRs
Dependencies
Priority
Suggested Size
MVP/V1/Future
Definition of Done implications

Apply INVEST.
Use Given/When/Then where useful.
Reject or split stories that:
- contain multiple independent outcomes
- are purely technical tasks
- have unclear value
- are not testable
- are too large to estimate confidently

End with:
1. Story map
2. Epic mapping
3. Dependency graph
4. MVP story set
5. Remaining unknowns
```

---

# 16. Master Prompt — Refine One User Story

```text
Act as Product Owner + senior engineer + QA lead + security reviewer + UX reviewer.

Story:
[USER STORY]

Perform a hostile-quality review.

Check:
1. User value
2. Persona correctness
3. Ambiguous wording
4. Hidden requirements
5. Missing acceptance criteria
6. Edge cases
7. Failure paths
8. Authorization
9. Validation
10. Data consistency
11. Concurrency
12. Idempotency
13. Performance
14. Security
15. Accessibility where relevant
16. Observability
17. Dependencies
18. Testability
19. Scope
20. INVEST

Do not silently invent requirements.
For missing information, mark UNKNOWN or ASSUMPTION and create a clarification question.

Return:
A. Revised story
B. Acceptance criteria
C. Edge/failure cases
D. Test cases
E. Dependencies
F. Definition of Ready result
G. Blocking questions
```

---

# 17. Acceptance Criteria vs Definition of Done

## Acceptance Criteria

Specific to a story or feature:

```text
What must this behavior do?
```

## Definition of Done

A product/team quality standard:

```text
What quality state must completed work reach before it counts as done?
```

The Scrum Guide defines Definition of Done as the formal description of the state of the Increment when required quality measures are met. citeturn238509search2

---

# 18. Master Prompt — Acceptance Criteria

```text
You are a senior QA engineer and product manager.

Story:
[STORY]

Create precise, objectively testable acceptance criteria.

Cover where relevant:
1. Happy path
2. Required inputs
3. Validation
4. Empty states
5. Boundary values
6. Duplicate actions
7. Permission failures
8. Authentication failures
9. Missing data
10. External-service failures
11. Timeouts
12. Retry behavior
13. Concurrency
14. Idempotency
15. Data consistency
16. User-facing errors
17. Auditability
18. Performance constraints
19. Security constraints
20. Accessibility

Use Given/When/Then where useful.
Then produce positive, negative, edge, and security test cases.
```

---

# 19. Stage 7 — Domain Modeling for Large Applications

When applications grow, domain boundaries become more important than framework choice.

Useful concepts:

```text
Domain
Subdomain
Bounded Context
Entity
Value Object
Aggregate
Aggregate Root
Domain Service
Domain Event
Integration Event
Context Map
```

Microsoft's guidance describes bounded contexts as a way to handle complexity by separating conceptual modules and recommends keeping domain/service boundaries aligned to cohesive business capabilities. Boundary evaluation is iterative as the team's domain knowledge improves. citeturn355040search0turn355040search5turn355040search9

## Boundary questions

```text
What business capability lives here?
Who owns its rules?
Who owns its data?
What invariants must always hold?
Who needs to call it?
How often do components communicate?
Can it evolve independently?
What happens if the dependency is unavailable?
```

## Microservice rule

Do not create one service per database table.

Create a service boundary only when there is a real reason such as:

- Domain autonomy
- Independent scaling
- Independent deployment
- Security isolation
- Availability isolation
- Team ownership
- Technology/runtime requirements

Simple CRUD services may not justify complex DDD patterns; richer domain modeling is more useful where business rules are complex and change frequently. citeturn355040search1turn355040search6

---

# 20. Architecture Evolution Strategy

A strong default for many products is:

```text
Modular Monolith
      ↓
Observe coupling / scale / ownership
      ↓
Extract justified boundaries
      ↓
Selective services / eventing
```

Avoid:

```text
Idea
 ↓
10–20 microservices
 ↓
Distributed failure + deployment complexity
```

The architecture should evolve when evidence requires it.

---

# 21. Master Prompt — Domain & Boundary Analysis

```text
You are a Principal Architect specializing in Domain-Driven Design,
modular monoliths, distributed systems, and microservices.

Inputs:
[PRODUCT]
[USER STORIES]
[DOMAIN GLOSSARY]
[BUSINESS RULES]
[NFRs]

Identify:
1. Core domain
2. Supporting domains
3. Generic domains
4. Candidate bounded contexts
5. Context boundaries
6. Data ownership
7. Business invariants
8. Aggregate candidates
9. Domain events
10. Integration events
11. External systems
12. Security boundaries

Compare:
A. Modular monolith
B. Service-oriented architecture
C. Microservices
D. Event-driven architecture

For each evaluate complexity, operations, scaling, deployment independence,
team implications, failure modes, data consistency, cost, and migration difficulty.

Recommend the simplest architecture satisfying actual constraints.
Never recommend microservices solely because the product is expected to become large.

Produce:
- Context map
- Module/service candidates
- Data ownership map
- Integration boundaries
- Architecture risks
- Evolution/migration path
```

---

# 22. Stage 8 — System Architecture

## Architecture artifacts

A practical C4-oriented set is:

```text
1. System Context
2. Container / Module
3. Critical Dynamic Flows
4. Deployment
5. Data Flow
6. Security / Trust Boundaries
```

The C4 model provides context, container, component, and code diagrams plus dynamic and deployment diagrams. It notes that context and container diagrams are often sufficient for many teams and deeper diagrams should be added where they provide value. citeturn168926search2turn168926search5

## Architecture review dimensions

```text
Functional correctness
Security
Reliability
Availability
Performance
Scalability
Cost
Observability
Maintainability
Testability
Developer experience
Data governance
Disaster recovery
```

---

# 23. Master Prompt — Architecture

```text
You are a Principal Software Architect.

Inputs:
[PRODUCT SCOPE]
[USER STORIES]
[DOMAIN MODEL]
[NFRs]

Design the production architecture.

First identify:
- architectural drivers
- scale assumptions
- availability requirements
- latency requirements
- security requirements
- data sensitivity
- cost constraints
- team/deployment constraints

Then produce:
1. Architecture overview
2. System context
3. Modules/containers
4. Component responsibilities
5. Critical flows
6. Data flows
7. Data ownership
8. Authentication
9. Authorization
10. External integrations
11. Background jobs
12. Cache
13. Storage
14. Eventing
15. Observability
16. Error handling
17. Reliability
18. Scalability
19. Disaster recovery
20. Deployment
21. Security controls
22. Cost model

For every major technology choice provide:
- Requirement
- Choice
- Alternatives
- Trade-offs
- Why now
- Migration path

Reject infrastructure without a concrete purpose.
Prefer simplicity → modularity → measured scaling → selective distribution.
```

---

# 24. Architecture Decision Records (ADR)

Use ADRs for decisions that would be expensive or confusing to rediscover.

```markdown
# ADR-XXX — [Decision]

## Status
Proposed | Accepted | Superseded | Deprecated

## Context
[Problem and constraints.]

## Decision
[Chosen approach.]

## Alternatives
[Alternative approaches.]

## Why
[Reason for choice.]

## Trade-offs
[Benefits, costs, risks.]

## Consequences
[What becomes true because of the decision.]

## Validation
[Evidence or test that supports the decision.]

## Revisit When
[Triggers that should cause reconsideration.]
```

---

# 25. Stage 9 — Schema Builder

## Goal

Translate business behavior into a deliberate data model.

Think in this order:

```text
Business concepts
→ Entities
→ Relationships
→ Invariants
→ Ownership
→ Access patterns
→ Constraints
→ Indexes
→ Transactions
→ Migrations
```

## Entity checklist

```text
[ ] Purpose
[ ] Identity
[ ] Fields/types
[ ] Required/optional
[ ] Primary key
[ ] Foreign keys
[ ] Unique constraints
[ ] Check constraints
[ ] Relationships
[ ] Ownership
[ ] Lifecycle
[ ] Audit
[ ] Sensitive fields
[ ] Retention
[ ] Indexes
[ ] Read patterns
[ ] Write patterns
[ ] Concurrency
[ ] Migration strategy
```

## Master Prompt

```text
You are a senior database architect and domain modeler.

Inputs:
[DOMAIN MODEL]
[USER STORIES]
[BUSINESS RULES]
[ARCHITECTURE]

First create the conceptual data model.

For every entity define:
- Purpose
- Identity
- Fields
- Types
- Required/optional
- Primary key
- Foreign keys
- Unique/check constraints
- Relationships
- Indexes
- Ownership
- Lifecycle
- Audit
- Sensitive fields
- Retention
- Concurrency

Also define:
1. Transaction boundaries
2. Consistency requirements
3. Read patterns
4. Write patterns
5. Expected scale
6. Migration strategy
7. Backup/recovery implications
8. Deletion and archival

Create traceability:
User Story → Required Data → Read/Write → Entity → Constraint

Flag missing entities, redundant entities, dangerous coupling,
ambiguous ownership, performance risks, and privacy risks.

Only after the conceptual model is validated should you generate ORM/SQL schema.
```

---

# 26. Stage 10 — API & Contract Design

OpenAPI provides a programming-language-independent contract for HTTP APIs, making interfaces discoverable and understandable to humans and machines without requiring source inspection. citeturn168926search3turn168926search10

For each endpoint define:

```text
Method
Path
Purpose
Story mapping
Authentication
Authorization
Request schema
Validation
Response schema
Error schema
Status codes
Pagination
Filtering
Sorting
Idempotency
Rate limits
Versioning
Audit
```

## Master Prompt

```text
You are a senior backend architect and API designer.

Inputs:
[USER STORIES]
[DOMAIN MODEL]
[SCHEMA]
[ARCHITECTURE]

Design the API contract before implementation.

For each endpoint define:
- ID
- Method/path
- Purpose
- User-story mapping
- Authentication
- Authorization
- Request schema
- Response schema
- Validation
- Errors/status codes
- Pagination/filtering/sorting
- Idempotency
- Rate limits
- Audit
- Versioning

Check consistency, security, backward compatibility,
unnecessary endpoints, and missing contracts.

Produce an OpenAPI-ready structure.
Do not implement the API.
```

---

# 27. Stage 11 — Playbook / MCP / Tools / Agents

For AI systems, treat tools as controlled interfaces.

Preferred flow:

```text
User
 ↓
Agent
 ↓
Policy / Authorization
 ↓
Tool or MCP Server
 ↓
Application Service
 ↓
Database / External System
```

Avoid:

```text
LLM → unrestricted database
LLM → unrestricted shell
LLM → unrestricted production cloud account
```

## Tool classes

```text
READ
WRITE
HIGH-RISK
```

High-risk tools may include payment, privilege changes, deletion, production deployment, or security configuration changes.

## Master Prompt

```text
You are a Principal AI Systems Architect.

Inputs:
[PRODUCT]
[USER STORIES]
[ARCHITECTURE]
[API CONTRACT]
[SECURITY REQUIREMENTS]

Identify where AI/agents/automation/MCP create measurable value.
For each candidate determine:
- Why AI is needed
- Why deterministic code is insufficient
- Expected benefit
- Failure cost
- Evaluation method
- Latency
- Cost
- Security risk

Then define the tooling playbook.

For every tool specify:
Name
Purpose
Input
Output
Caller
Authorization
Validation
Side effects
Failure modes
Retry/timeout
Rate limits
Audit event
Human approval
Data exposure
Prompt-injection considerations

For each agent define:
Goal
Allowed tools
Prohibited actions
Required context
Memory
Termination criteria
Escalation
Evaluation metrics

Never grant unrestricted access.
```

---

# 28. AI Feature Engineering Lifecycle

AI features require their own evaluation loop:

```text
Problem
→ Task definition
→ Baseline
→ Dataset
→ Evaluation criteria
→ Prompt/retrieval/model design
→ Implementation
→ Offline evaluation
→ Adversarial testing
→ Pilot
→ Production monitoring
→ Feedback
→ Evaluation update
```

Measure where relevant:

```text
Task success
Accuracy
Groundedness
Hallucination rate
Latency
Cost
Safety
Consistency
Fallback rate
Human escalation
```

Agent systems additionally benefit from:

```text
Tool-selection accuracy
Task completion
Unnecessary tool calls
Loops
Retries
Failure recovery
Escalation rate
```

---

# 29. Stage 12 — Implementation Planning

A good plan is a dependency-aware set of vertical slices.

Each work item should be classified as:

```text
BLOCKING
DEPENDENT
PARALLELIZABLE
SPIKE
MIGRATION
HIGH-RISK
```

## Master Prompt

```text
You are a senior engineering manager.

Inputs:
[ARCHITECTURE]
[SCHEMA]
[API CONTRACT]
[USER STORIES]
[ACCEPTANCE CRITERIA]
[AI PLAYBOOK]

Create the implementation plan.

Produce:
1. Repository/module structure
2. Environment/configuration
3. Infrastructure
4. Database
5. Backend/domain work
6. API work
7. Frontend work
8. AI/agent work
9. Integrations
10. Tests
11. Observability
12. Deployment
13. Security
14. Documentation

For each item define:
- Story mapping
- Task
- Dependency
- Risk
- Parallelization
- Estimated size
- Definition of Done
- Verification

Prefer vertical slices.
Do not create work with no traceable product, quality, security,
or operational purpose.
```

---

# 30. Stage 13 — Test Strategy

Use a risk-based mix:

```text
Unit
Integration
API/contract
Component/UI
End-to-end
Security
Performance
AI evaluation
```

Do not optimize for a single coverage number. Test important behavior and risk.

OWASP ASVS provides a structured basis for testing application security controls and secure-development requirements. citeturn377640search12

## Master Prompt

```text
You are a Principal QA Engineer, SDET, Security Engineer,
Performance Engineer, and AI Evaluation Engineer.

Inputs:
[USER STORIES]
[ACCEPTANCE CRITERIA]
[ARCHITECTURE]
[API CONTRACT]
[AI REQUIREMENTS]

Create a risk-based testing strategy.

For each critical behavior define relevant:
- Unit tests
- Integration tests
- API tests
- E2E tests
- Negative tests
- Security tests
- Performance tests
- AI evaluation tests

For each test give:
Input
Precondition
Action
Expected result
Failure condition

Also define fixtures, test data, mocks, environment requirements,
CI gates, regression strategy, and production verification.

Prioritize by business impact × likelihood × failure cost.
```

---

# 31. Stage 14 — Secure Development & Threat Modeling

Security starts during design.

OWASP recommends threat modeling as a structured, repeatable process performed early and maintained as the system changes. It asks, in essence: what are we building, what can go wrong, what will we do about it, and did we do enough? citeturn238509search0

## Master Prompt

```text
You are a senior application security architect.

Inputs:
[ARCHITECTURE]
[DATA FLOWS]
[USER STORIES]
[AUTHORIZATION MODEL]
[EXTERNAL INTEGRATIONS]

Perform threat modeling.

1. Identify assets.
2. Identify actors.
3. Identify entry points.
4. Identify trust boundaries.
5. Identify sensitive data.
6. Identify threats.
7. Rank threats.
8. Define mitigations.
9. Define verification tests.
10. Record residual risk.

Cover where relevant:
Authentication
Authorization
Injection
XSS
CSRF
SSRF
File upload
Secrets
Supply chain
API abuse
Rate limits
Data leakage
Multi-tenancy
Privilege escalation
Prompt injection
Tool abuse
Destructive actions

Map major mitigations:
Requirement → Design → Implementation → Test
```

---

# 32. Stage 15 — Performance & Reliability

Use:

```text
Requirement
→ Measure
→ Find bottleneck
→ Hypothesis
→ Change
→ Benchmark
→ Verify
```

Track where relevant:

```text
p50
p95
p99
Throughput
Error rate
CPU
Memory
DB latency
Cache hit rate
Queue delay
External dependency latency
AI latency/tokens
```

For important services, define SLOs when justified. Google SRE's guidance connects SLOs with error budgets and operational/release decisions. citeturn168926search9

Reliability design should explicitly consider:

```text
Timeouts
Retries
Backoff
Idempotency
Queueing
Dead-letter handling
Graceful degradation
Backups
Rollback
Recovery
```

Do not blindly retry non-idempotent mutations.

---

# 33. Stage 16 — Cost Engineering

For expensive systems define:

```text
Unit of usage
Cost per unit
Expected usage
Peak usage
Monthly estimate
Failure/retry cost
Optimization options
```

For AI:

```text
Tokens/request
Requests/user
Model price
Retrieval cost
Tool calls
Retries
Evaluation cost
```

Cost should be an architecture input, not merely a finance report after deployment.

---

# 34. Stage 17 — Implementation

## Coding rules

```text
1. Implement approved behavior only.
2. Prefer small changes.
3. Keep business rules explicit.
4. Validate external input.
5. Authorize protected operations.
6. Handle failures explicitly.
7. Avoid hidden side effects.
8. Add tests with the change.
9. Avoid logging secrets/sensitive data.
10. Preserve contracts unless intentionally changed.
11. Document important decisions.
12. Refactor when complexity becomes visible.
```

The Twelve-Factor methodology is useful background for service applications, including configuration, backing services, build/release/run separation, logs, and reducing environment divergence. citeturn168926search1

## Master Coding Prompt

```text
You are a senior production software engineer.

Implement:
[USER STORY]

Approved context:
Architecture: [ARCHITECTURE]
Schema: [SCHEMA]
API: [API CONTRACT]
Acceptance Criteria: [ACCEPTANCE CRITERIA]
Existing code: [REPOSITORY CONTEXT]

Before coding:
1. Identify affected modules.
2. Identify dependencies.
3. Identify risks.
4. Identify tests.
5. Identify migration implications.

Then implement the smallest production-quality change.

Rules:
- Follow approved architecture.
- Do not invent features.
- Do not bypass authorization.
- Validate inputs.
- Handle failures.
- Avoid unnecessary dependencies.
- Preserve compatibility.
- Add/update tests.
- Update docs when behavior changes.

After implementation report:
Files changed
Behavior implemented
Tests added
Tests run
Migration status
Security considerations
Known limitations
Follow-up work

If requirements are contradictory or missing, stop and identify the ambiguity.
```

---

# 35. Stage 18 — Independent Evaluation

Do not ask only whether the code runs.

Evaluate:

```text
Requirement coverage
Functional correctness
UX
Security
Data integrity
Reliability
Performance
Scalability
Cost
Observability
Maintainability
AI quality
Operational readiness
```

## Master Prompt

```text
Act as an independent reviewer.

Inputs:
[PRODUCT REQUIREMENTS]
[USER STORIES]
[ACCEPTANCE CRITERIA]
[ARCHITECTURE]
[IMPLEMENTATION]
[TEST RESULTS]
[METRICS]

Assume defects may exist.

Evaluate:
1. Requirement coverage
2. Functional correctness
3. UX
4. Error handling
5. Security
6. Data integrity
7. Performance
8. Reliability
9. Scalability
10. Cost
11. Observability
12. Maintainability
13. AI quality if applicable

Classify findings:
CRITICAL / HIGH / MEDIUM / LOW

For every finding give:
Evidence
Impact
Root/contributing cause
Recommended fix
Verification method

End with:
RELEASE / NO RELEASE

List blockers, non-blockers, regression tests, and post-release metrics.
```

---

# 36. Stage 19 — Deployment & Production Readiness

## Checklist

```text
[ ] Configuration externalized
[ ] Secrets managed securely
[ ] Database migrations tested
[ ] CI/CD operational
[ ] Health checks
[ ] Monitoring
[ ] Logs
[ ] Alerts
[ ] Backups
[ ] Restore procedure
[ ] Rollback plan
[ ] Security review
[ ] Rate limits
[ ] Documentation
[ ] Ownership/on-call
[ ] Cost monitoring
```

## Master Prompt

```text
You are a senior DevOps/SRE engineer.

Inputs:
[ARCHITECTURE]
[IMPLEMENTATION]
[TEST RESULTS]
[SECURITY REVIEW]
[PERFORMANCE RESULTS]

Create the production deployment plan.

Define:
1. Environments
2. Infrastructure
3. Build/test pipeline
4. Artifact handling
5. Configuration
6. Secrets
7. Database migrations
8. Deployment strategy
9. Health checks
10. Observability
11. Monitoring
12. Alerting
13. Backup/restore
14. Rollback
15. Disaster recovery
16. Security controls
17. Cost controls

Return:
- Pre-deployment checklist
- Deployment checklist
- Post-deployment verification
- Rollback procedure
- Incident triggers
```

---

# 37. Stage 20 — Operate & Learn

Production is not the end of the lifecycle.

Track:

## Product

```text
Activation
Conversion
Retention
Feature adoption
User feedback
```

## Engineering

```text
Errors
Latency
Throughput
Availability
Deployment frequency
Change failure rate
Recovery time
```

## AI

```text
Task success
Groundedness
Hallucination rate
Tool-call accuracy
Escalation
Cost
Latency
```

---

# 38. Post-Release Review Prompt

```text
You are a senior product, engineering, reliability, and AI review lead.

Inputs:
[PRODUCT METRICS]
[USER FEEDBACK]
[ERRORS]
[INCIDENTS]
[PERFORMANCE]
[AI EVALUATION]
[COST]

Analyze the release.

Identify:
1. User outcomes
2. Adoption
3. Failure patterns
4. Reliability issues
5. Security issues
6. Performance bottlenecks
7. AI-quality problems
8. Cost problems
9. Unexpected behavior
10. Technical debt
11. Improvement opportunities

For every recommendation provide:
Problem
Evidence
Impact
Confidence
Effort
Risk if ignored
Proposed change
Validation metric

Prioritize using:
Impact × Confidence ÷ Effort

Do not recommend features simply because they sound impressive.
```

---

# 39. Requirements → Implementation Traceability

For large applications, maintain:

```text
Product Goal
  ↓
Epic
  ↓
Feature
  ↓
User Story
  ↓
Acceptance Criterion
  ↓
UI / API / Domain Logic
  ↓
Database / Infrastructure
  ↓
Test
  ↓
Production Metric
```

A requirement with no implementation is a gap.
An implementation with no product, quality, security, or operational rationale is a candidate for removal.

## Traceability matrix

| Requirement | Story | Acceptance Criterion | Design | Implementation | Test | Metric |
|---|---|---|---|---|---|---|
| REQ-001 | US-001 | AC-001 | ARCH-01 | PR-101 | T-001 | M-001 |
| REQ-002 | US-004 | AC-003 | ARCH-03 | PR-108 | T-011 | M-004 |

---

# 40. Definition of Ready

Recommended baseline:

```text
[ ] User/value understood
[ ] Scope bounded
[ ] Acceptance criteria testable
[ ] Dependencies known
[ ] Security impact understood
[ ] Data impact understood
[ ] UX impact understood
[ ] Relevant NFRs identified
[ ] Team can estimate
[ ] Major questions resolved or explicitly tracked
[ ] No major contradiction
```

---

# 41. Definition of Done

Recommended baseline:

```text
[ ] Acceptance criteria passed
[ ] Automated tests pass
[ ] Relevant integration/E2E tests pass
[ ] Security requirements verified
[ ] Authorization verified
[ ] Error handling verified
[ ] Observability added
[ ] Documentation updated
[ ] Migration tested where applicable
[ ] Code reviewed
[ ] CI passes
[ ] No release-blocking known defect
[ ] Deployable
```

The DoD should become stricter when experience reveals recurring quality failures. citeturn168926search8turn238509search2

---

# 42. Documentation Architecture

Recommended structure:

```text
docs/
├── 00-product-brief.md
├── 01-discovery.md
├── 02-deep-dive.md
├── 03-personas.md
├── 04-workflows.md
├── 05-product-scope.md
├── 06-epics.md
├── 07-user-stories/
│   ├── US-001.md
│   ├── US-002.md
│   └── ...
├── 08-domain-model.md
├── 09-architecture.md
├── 10-schema.md
├── 11-api-contract.yaml
├── 12-ai-playbook.md
├── 13-security-threat-model.md
├── 14-test-strategy.md
├── 15-evaluation.md
├── 16-deployment.md
├── 17-operations.md
├── 18-feedback.md
└── adr/
    ├── ADR-001.md
    ├── ADR-002.md
    └── ...
```

The master playbook describes the methodology. Project-specific artifacts should live separately so the methodology does not become a giant requirements document.

---

# 43. Recommended Repository Structure

```text
project/
├── apps/
│   ├── web/
│   ├── api/
│   └── worker/
├── modules/
│   ├── identity/
│   ├── core-domain/
│   ├── billing/
│   └── ...
├── services/
├── packages/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── contract/
│   ├── e2e/
│   ├── security/
│   ├── performance/
│   └── evaluation/
├── infra/
├── migrations/
├── scripts/
├── docs/
├── .github/
│   └── workflows/
├── .env.example
└── README.md
```

Do not create every folder just because the template contains it. Keep only structures justified by the product.

---

# 44. Git & Integration Strategy

A healthy integration loop:

```text
Pull latest main
→ Small change
→ Local tests
→ Commit
→ Push
→ CI
→ Review
→ Merge
```

Continuous Integration is intended to integrate changes frequently and verify them with automated builds/tests so integration problems are discovered early. citeturn377640search16

Prefer:

```text
Small PRs
Clear commits
Automated checks
Protected main
Review before merge
No broken main
Fast feedback
```

---

# 45. Observability

For every production capability, decide what is needed:

```text
Logs
Metrics
Traces
Audit events
Health checks
Dashboards
Alerts
```

The system should let the team answer:

```text
What happened?
Who was affected?
When?
Why?
How often?
What changed?
Can we reproduce it?
Did recovery work?
```

Never log secrets or unnecessary sensitive data.

---

# 46. Multi-Tenant SaaS Checklist

For multi-tenant applications explicitly decide:

```text
Tenant isolation
Identity model
Tenant-aware authorization
Data ownership
Per-tenant configuration
Per-tenant rate limits
Billing model
Observability
Export/deletion
Cross-tenant access prevention
```

Do not assume `user_id` alone is a security boundary. Authorization should consider tenant, actor, resource, action, and role.

---

# 47. Data Migration Safety

For every production schema change:

```text
Understand existing data
→ Backup/restore strategy
→ Test migration
→ Compatibility plan
→ Deploy
→ Verify
→ Monitor
→ Rollback/repair
```

For risky changes, consider expand/contract:

```text
Expand
→ compatibility release
→ backfill
→ switch reads/writes
→ verify
→ contract/remove old structure
```

---

# 48. Release Strategy

Choose deliberately:

```text
Standard deployment
Feature flag
Canary
Blue/green
Phased rollout
Shadow traffic
A/B experiment
Internal-only release
```

Decision factors:

```text
Risk
Blast radius
Rollback capability
Data migration
User base
Observability
```

---

# 49. Common Anti-Patterns

## Big-bang development

```text
Months of coding → integration → surprise
```

## Premature microservices

```text
Microservice per entity
```

## Shared database ownership

Multiple services directly mutating each other's data.

## Giant user stories

One story describes an entire subsystem.

## AI-generated architecture without review

Accepting an AI proposal without requirements, evidence, constraints, or trade-offs.

## Testing at the end

Waiting until the whole product exists before validating behavior.

## Future-proofing without evidence

Adding Kafka/Kubernetes/event sourcing/CQRS/complex agent orchestration solely because the product may someday be large.

## Technical-task user stories

Turning database tables, React components, or endpoints into user outcomes.

---

# 50. Large-App Decision Rule

Before adding complexity, ask:

```text
What requirement forces it?
What failure does it prevent?
What scale assumption requires it?
What team boundary requires it?
What operational benefit justifies it?
Can we introduce it later?
What migration path exists?
```

If none can be answered, defer the complexity.

---

# 51. Generic Stage-Gate Prompt

Run this after every major stage.

```text
You are the independent reviewer for the current product-development stage.

Approved previous context:
[CONTEXT]

Current stage:
[STAGE]

Current artifact:
[ARTIFACT]

Review without assuming it is correct.

Check:
1. Completeness
2. Correctness
3. Internal consistency
4. Traceability
5. User value
6. Technical feasibility
7. Security
8. Reliability
9. Performance
10. Cost
11. Maintainability
12. Unknowns
13. Contradictions
14. Hidden assumptions
15. Missing failure paths

Classify findings:
BLOCKER / HIGH / MEDIUM / LOW

For every issue give:
Evidence
Why it matters
Recommended action
Verification method

Return:
PASS / PASS WITH CHANGES / FAIL

If PASS, generate the structured input for the next stage.
If FAIL, list only changes required to reach PASS.
Do not silently modify the artifact.
```

---

# 52. Stage-to-Stage Handoff Prompt

```text
Read the approved artifact:
[ARTIFACT]

Next stage:
[NEXT STAGE]

Extract only information required by the next stage.

Return:
1. Confirmed requirements
2. Decisions
3. Constraints
4. Dependencies
5. Relevant data
6. Risks
7. Unknowns
8. Open questions
9. Required inputs
10. Items that MUST NOT be assumed

Separate:
CONFIRMED / ASSUMED / UNKNOWN.
Do not add new facts.
```

This reduces context drift in long AI-assisted projects.

---

# 53. AI-Assisted Development Rules

Use AI as a reasoning/implementation assistant, not the authority for architecture.

## Give the AI

```text
Product context
Current stage
Approved previous artifacts
Constraints
Required output format
Validation criteria
```

## Ask AI to

- Identify ambiguity
- Identify contradictions
- Generate alternatives
- Review decisions
- Generate tests
- Analyze risk
- Explain trade-offs
- Implement bounded stories
- Refactor
- Diagnose failures

## Never let AI silently

- Invent requirements
- Change architecture
- Remove security controls
- Change API contracts without reporting it
- Add dependencies without justification
- Assume data is clean
- Assume services never fail
- Assume production scale

---

# 54. The Product Engineering Golden Loop

```text
UNDERSTAND
    ↓
DEFINE
    ↓
DESIGN
    ↓
BUILD
    ↓
VERIFY
    ↓
RELEASE
    ↓
OBSERVE
    ↓
LEARN
    ↓
IMPROVE
    ↺
```

At every stage ask:

```text
What do we know?
What are we assuming?
What could go wrong?
How will we verify it?
What evidence would change our decision?
```

---

# 55. Continuous Improvement — Make This MD Better Over Time

This playbook is intentionally a **living artifact**.

## Improvement sources

```text
User feedback
Engineering retrospectives
Production incidents
Security findings
Failed releases
Architecture reviews
Performance tests
Cost reports
AI evaluations
Code reviews
Repeated requirement ambiguities
Repeated story defects
New standards/specifications
Updated official documentation
Team feedback
```

## Improvement rule

Do not change the playbook merely because someone prefers another style.

Prefer:

```text
Evidence
→ Pattern
→ Proposal
→ Trial
→ Result
→ Adopt / Reject
```

## Change Proposal Template

```markdown
## CP-XXX — [Change]

### Observation
[What happened?]

### Evidence
[Incident, metric, review finding, repeated problem, research.]

### Current Guidance
[Existing rule.]

### Proposed Guidance
[New rule.]

### Why
[Expected benefit.]

### Risk
[Potential downside.]

### Trial
[How to validate the change.]

### Result
[Observed result.]

### Decision
Adopt / Trial / Reject / Revisit

### Date
YYYY-MM-DD
```

---

# 56. Master Prompt — Improve This Playbook

```text
You are the maintainer of a product-engineering playbook.

Current playbook:
[RELEVANT SECTION OR FULL PLAYBOOK]

Project evidence:
[RETROSPECTIVE]
[INCIDENTS]
[USER FEEDBACK]
[TEST FINDINGS]
[ARCHITECTURE REVIEW]
[PERFORMANCE]
[AI EVALUATION]
[COST]

Determine whether the playbook should change.

Rules:
- Do not generalize from a weak anecdote unless severity is high.
- Prefer repeatable, generalizable lessons.
- Avoid adding unnecessary process.
- Prefer clear rules over vague advice.
- Preserve flexibility where context matters.
- Do not turn project-specific details into global rules without evidence.

For every proposed change provide:
1. Evidence
2. Repeated pattern
3. Existing guidance affected
4. Proposed change
5. Expected benefit
6. Downside/risk
7. Applicability
8. Validation plan

Return:
ADOPT / TRIAL / REJECT

Then generate the exact markdown patch required to update the playbook.
```

---

# 57. Periodic Review Procedure

At every meaningful release, ask:

```text
1. Which step caused rework?
2. Which requirement was ambiguous?
3. Which assumption was wrong?
4. Which test was missing?
5. Which architecture decision caused pain?
6. Which security issue escaped early review?
7. Which production signal was missing?
8. Which AI behavior surprised us?
9. Which process step added little value?
10. What lesson is general enough to become a reusable rule?
```

At least once per major product phase review:

```text
Definition of Ready
Definition of Done
Architecture rules
Threat model
Testing standards
Observability
Deployment process
Cost controls
AI evaluation
```

---

# 58. Maturity Model

## Level 0 — Idea

Problem is poorly defined.

## Level 1 — Defined

```text
Users
Problem
Product Goal
MVP
```

## Level 2 — Designed

```text
Stories
Architecture
Schema
APIs
Security
```

## Level 3 — Working

```text
Vertical slices
Tests
CI
```

## Level 4 — Production

```text
Deployment
Observability
Security
Reliability
Backups
```

## Level 5 — Scalable

```text
Measured bottlenecks
Clear boundaries
Operational maturity
Cost controls
SLOs where justified
```

## Level 6 — Adaptive

```text
Continuous experimentation
Automated evaluation
Architecture evolution
Data-driven roadmap
Post-incident learning
```

---

# 59. Minimum Serious-Product Checklist

Before the first production release of a serious application, verify that the project has at least:

```text
[ ] Problem definition
[ ] Product Goal
[ ] Personas / actors
[ ] Critical journeys
[ ] MVP scope
[ ] Story backlog
[ ] Acceptance criteria
[ ] Definition of Ready
[ ] Definition of Done
[ ] Domain boundaries
[ ] Architecture diagrams
[ ] ADRs for major decisions
[ ] Data model
[ ] Data ownership
[ ] API contracts
[ ] Security/threat model
[ ] Test strategy
[ ] CI
[ ] Observability
[ ] Deployment plan
[ ] Backup/restore
[ ] Rollback strategy
[ ] Cost model
[ ] Production metrics
[ ] Feedback loop
```

---

# 60. Final Operating Principle

A large application is not made manageable by adding more frameworks.

It becomes manageable through:

```text
Clear product goal
+
Evidence-based requirements
+
Small user-valued increments
+
Explicit domain boundaries
+
Simple architecture
+
Stable contracts
+
Owned data
+
Automated verification
+
Security by design
+
Observable production systems
+
Continuous feedback
+
Disciplined evolution
```

The objective is not to predict the entire future system.

The objective is to make the **next decision correct, visible, testable, and reversible where possible**, while maintaining enough structure for the system to evolve when evidence changes.

---

# 61. Reference Sources Consulted for This Baseline

This playbook uses a curated set of authoritative/primary references rather than claiming to cover literally every page on the internet.

1. Scrum Guide — Product Goal, Product Backlog, refinement, Increment, Definition of Done.
2. Agile Alliance — User Stories, INVEST, Definition of Done.
3. Atlassian Agile Guides — user stories, 3 Cs, acceptance criteria, Definition of Done.
4. C4 Model — software architecture diagrams.
5. AWS Well-Architected Framework — architecture review dimensions.
6. OWASP ASVS — application security verification requirements.
7. OWASP Threat Modeling Cheat Sheet — threat modeling as an early and maintained SDLC activity.
8. OpenAPI Specification — API contracts.
9. Twelve-Factor App — service application operational practices.
10. Google SRE — SLOs and error budgets.
11. Martin Fowler — Continuous Integration.
12. Microsoft Architecture Center / DDD guidance — bounded contexts, service/data ownership, and evolutionary service boundaries.

## Source URLs

- https://scrumguides.org/scrum-guide.html
- https://agilealliance.org/glossary/user-stories/
- https://agilealliance.org/glossary/invest/
- https://agilealliance.org/glossary/definition-of-done/
- https://www.atlassian.com/agile/project-management/user-stories
- https://www.atlassian.com/agile/project-management/definition-of-done
- https://c4model.com/
- https://docs.aws.amazon.com/wellarchitected/
- https://owasp.org/www-project-application-security-verification-standard/
- https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html
- https://spec.openapis.org/oas/
- https://12factor.net/
- https://sre.google/workbook/
- https://martinfowler.com/articles/continuousIntegration.html
- https://learn.microsoft.com/azure/architecture/

---

# 62. Changelog

## v1.0 — 2026-10-07

- Created end-to-end product-development lifecycle.
- Added raw requirement extraction.
- Added divergence and deep-dive stages.
- Added personas and workflow modeling.
- Added Product Goal, MVP, scope control, epics and capabilities.
- Added detailed user-story workflow.
- Added INVEST, 3 Cs, acceptance criteria, edge/failure behavior.
- Added Definition of Ready and Definition of Done.
- Added domain/bounded-context guidance.
- Added architecture, ADR, schema, API, security and threat modeling.
- Added AI/MCP/agent playbook design.
- Added testing, performance, reliability and cost practices.
- Added independent evaluation and deployment prompts.
- Added traceability and continuous-improvement mechanisms.
- Added source-backed references for the baseline.

