# OLD FLOW DRIVER DEPRECATION AUDIT

**Status:** ✅ Phase 3.4 In Progress - Deprecation Started
**Date:** 2025-10-17
**Author:** Development Team + Claude Code Analysis

---

## 📋 Overview

This document audits the deprecation of the old FlowDriver system as part of Phase 3.4 of the chat system migration. The goal is to ensure all code uses JsonbFlowProcessor instead of old drivers.

## 🔍 Current Audit Results

### Files Requiring Migration

| File | Current Status | Action Required | Priority |
|------|----------------|-----------------|----------|
| `src/admin/hooks/useAdminChat.ts` | ✅ **MIGRATED** | Already uses JsonbFlowProcessor | - |
| `src/features/chat/hooks/shared/useConversationController.ts` | ✅ **DEPRECATED** | Added @deprecated warning with migration example | Medium |
| `src/features/chat/actions/shared/startConversation.ts` | ❌ **NEEDS MIGRATION** | Still uses DatabaseFlowDriver & ScriptedFlowDriver | High |
| `src/features/chat/actions/shared/sendConversationMessage.ts` | ❌ **NEEDS MIGRATION** | Still uses old FlowDriver interface | High |
| `src/features/chat/actions/shared/endConversation.ts` | ❌ **NEEDS AUDIT** | Needs to be checked and potentially migrated | Medium |
| `src/customer/pages/CustomerDashboard.tsx` | ❌ **NEEDS VERIFICATION** | Verify uses new flow system | Medium |

### Deprecated Flow Driver Files

| File | Status | Deprecation Added |
|------|--------|-------------------|
| `src/features/chat/adapters/FlowDriver.ts` | ✅ **DEPRECATED** | @deprecated warning added |
| `src/features/chat/adapters/ScriptedFlowDriver.ts` | ✅ **DEPRECATED** | @deprecated warning added |
| `src/features/chat/adapters/DatabaseFlowDriver.ts` | ✅ **DEPRECATED** | @deprecated warning added |

## 🔄 Migration Patterns

### OLD (ScriptedFlowDriver)
```typescript
import { ScriptedFlowDriver } from '@features/chat/adapters/ScriptedFlowDriver';
import { customerFlows } from '@/chatLogic/customer';

const driver = new ScriptedFlowDriver(customerFlows['about']);
const messages = await driver.initial({});
```

### NEW (JsonbFlowProcessor)
```typescript
import { JsonbFlowProcessor } from '@features/chat/services/JsonbFlowProcessor';
import { getFlowDefinition } from '@features/chat/api/jsonbChatFlowApi';

const flowDefinition = await getFlowDefinition('about');
const result = await JsonbFlowProcessor.startFlow({
  flowId: 'about',
  customerId,
  flowDefinition,
});
```

### OLD (DatabaseFlowDriver)
```typescript
import { DatabaseFlowDriver } from '@features/chat/adapters/DatabaseFlowDriver';

const driver = new DatabaseFlowDriver('issue-ticket');
await driver.end(sessionId);
```

### NEW (JsonbFlowProcessor + API)
```typescript
import { endSessionV2 } from '@features/chat/api/jsonbChatFlowApi';

await endSessionV2(sessionId);
```

## 📝 Migration Checklist

### Code Migration
- [x] Audit all files importing FlowDriver, ScriptedFlowDriver, or DatabaseFlowDriver
- [x] Update useAdminChat.ts to use JsonbFlowProcessor ✅ Already migrated
- [x] Update useConversationController.ts (deprecate or refactor) ✅ Added deprecation
- [ ] Update startConversation.ts action
- [ ] Update endConversation.ts action
- [ ] Update sendConversationMessage.ts action
- [ ] Verify CustomerDashboard.tsx uses new flow system
- [x] Add deprecation warnings to all old flow driver files

### Testing
- [ ] Test all customer flows (ask-quote, issue-ticket, payment-upload)
- [ ] Test all admin flows (reply-inquiry, send-quote-proposal)
- [ ] Verify no runtime errors from old flow driver imports
- [ ] Verify all flows execute via JsonbFlowProcessor

### Documentation
- [x] Create OLD_FLOW_DRIVER_AUDIT.md ✅ This document
- [ ] Document migration path for each old pattern
- [ ] Add comments linking to migration plan

## 🚧 Current Blocking Issues

### High Priority Issues

1. **startConversation.ts Still Uses Old Drivers**
   - File: `src/features/chat/actions/shared/startConversation.ts`
   - Issue: Lines 6-7 import DatabaseFlowDriver and ScriptedFlowDriver
   - Impact: Any code using this action will use deprecated system
   - Solution: Rewrite to use JsonbFlowProcessor.startFlow()

2. **sendConversationMessage.ts Still Uses Old Interface**
   - File: `src/features/chat/actions/shared/sendConversationMessage.ts`
   - Issue: Line 8 imports FlowDriver interface
   - Impact: Complex message processing logic tied to old system
   - Solution: Rewrite to use JsonbFlowProcessor.processInput()

### Medium Priority Issues

3. **useConversationController Deprecation**
   - Status: ✅ Added deprecation warning
   - Impact: Wrapper around deprecated actions
   - Solution: Either refactor to use JsonbFlowProcessor or remove entirely

4. **CustomerDashboard.tsx Verification Needed**
   - Status: ❌ Not yet verified
   - Impact: Unknown if customer dashboard uses old or new flow system
   - Solution: Audit and update if needed

## 📊 Migration Progress

```
Phase 3.4: Old Flow Driver Deprecation
├── Audit Completed                ✅
├── Deprecation Warnings Added     ✅
├── useAdminChat Migrated         ✅ (Already Done)
├── useConversationController Deprecated ✅
├── Shared Actions Migration       🔄 (In Progress)
│   ├── startConversation.ts     ❌ (Needs Migration)
│   ├── sendConversationMessage.ts ❌ (Needs Migration)
│   └── endConversation.ts       ❌ (Needs Audit)
├── CustomerDashboard Verification ❌ (Needs Verification)
└── Documentation Created        ✅
```

**Progress: 50% Complete**

## 🎯 Next Steps

1. **Immediate (High Priority):**
   - Migrate `startConversation.ts` to use JsonbFlowProcessor
   - Migrate `sendConversationMessage.ts` to use JsonbFlowProcessor
   - Audit and potentially migrate `endConversation.ts`

2. **Short Term (Medium Priority):**
   - Verify `CustomerDashboard.tsx` uses new flow system
   - Update any remaining references to old actions

3. **Final Phase 3.4 Completion:**
   - Run full regression tests
   - Update CHAT_SYSTEM_MIGRATION_PLAN.md with Phase 3.4 completion
   - Mark Phase 3.4 as completed

## 🔗 Related Documents

- `docs_guide/CHAT_SYSTEM_MIGRATION_PLAN.md` - Main migration plan
- `docs_guide/JSONB_CHAT_FLOW_SYSTEM.md` - JSONB flow documentation
- `src/features/chat/services/JsonbFlowProcessor.ts` - New flow processor

---

**Document Version:** 1.0
**Status:** Phase 3.4 In Progress
**Next Review Date:** After shared actions migration