# Autonomous Development System

## Loop
PLAN -> INSPECT -> IMPLEMENT -> TEST -> FIX -> TYPECHECK -> BUILD -> VERIFY -> UPDATE STATUS -> NEXT TASK

## Operating Rules
- Read PROJECT_STATUS.md first.
- Inspect existing code before changing it.
- Make small, reviewable changes.
- Preserve working behavior.
- Do not invent implementation status.
- Run relevant tests after changes.
- Run npm run typecheck and npm run build before closing a milestone.
- If a quality gate fails, fix it before moving forward.
- Update PROJECT_STATUS.md with facts only.

## Stop Conditions
Stop only when:
1. A destructive/irreversible decision requires approval.
2. Credentials, secrets, payments, or production deployment authorization are required.
3. Requirements are materially ambiguous.
4. The environment cannot execute required validation.

## Phase 4 Definition
Prototype -> production-oriented architecture:
- persistence boundary
- API/application boundary
- transactional POS workflow
- inventory audit trail
- tenant/branch boundaries
- UI integration
- resilience states
- security baseline
