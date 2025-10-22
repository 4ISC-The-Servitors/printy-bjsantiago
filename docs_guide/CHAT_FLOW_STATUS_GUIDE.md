# Chat Flow Status Guide

## Overview

This document outlines the status systems for the unified chat flow architecture, covering issue tickets, quotes, and orders. It describes the status progression, UI presentation, and the interfaces for both customers and administrators.

## Issue Ticket (Inquiry) Status System

### Database Schema
The `inquiries` table uses the following status constraint:
```sql
inquiry_status = ANY (ARRAY['new'::text, 'resolved'::text, 'closed'::text, 'under_review'::text, 'pending_customer_reply'::text, 'pending_admin_reply'::text])
```

### Status Definitions and UI Display

| Database Status | UI Display Text | Badge Variant | Description |
|-----------------|-----------------|---------------|-------------|
| `new` | New | info | Initial ticket submission, awaiting admin review |
| `under_review` | Under Review | warning | Admin is actively investigating the issue |
| `pending_customer_reply` | Pending Customer Reply | warning | Awaiting additional information from customer |
| `pending_admin_reply` | Pending Admin Reply | info | Customer has responded, admin action needed |
| `resolved` | Resolved | success | Issue has been successfully addressed |
| `closed` | Closed | secondary | Ticket is closed, no further action needed |

### Status Flow Progression

1. **New** → Initial submission by customer via chat flow
2. **Under Review** → Admin begins investigation
3. **Pending Customer Reply** → Admin needs more information from customer
4. **Pending Admin Reply** → Customer provides additional information
5. **Resolved** → Issue successfully resolved
6. **Closed** → Ticket closed (can be closed directly from any status if needed)

## Quote Status System

### Database Schema
The `quotes` table uses the following status constraint:
```sql
status = ANY (ARRAY['active'::text, 'spec_proposed'::text, 'accepted'::text, 'rejected'::text, 'ended'::text])
```

### Status Definitions and UI Display

| Database Status | UI Display Text | Badge Variant | Description |
|-----------------|-----------------|---------------|-------------|
| `active` | Active | info | Quote request is in progress |
| `spec_proposed` | Quote Sent | warning | Specifications and pricing have been sent to customer |
| `accepted` | Accepted | success | Customer has accepted the quote |
| `rejected` | Rejected | error | Customer has declined the quote |
| `ended` | Ended | secondary | Quote process concluded without acceptance |

## Order Status System

### Database Schema
The `orders` table uses the following status constraint:
```sql
status = ANY (ARRAY['awaiting_payment'::text, 'verifying_payment'::text, 'reupload_payment_proof'::text, 'processing'::text, 'for_delivery'::text, 'for_pickup'::text, 'completed'::text, 'cancelled'::text])
```

### Status Definitions and UI Display

| Database Status | UI Display Text | Badge Variant | Description |
|-----------------|-----------------|---------------|-------------|
| `awaiting_payment` | Awaiting Payment | warning | Customer needs to submit payment |
| `verifying_payment` | Verifying Payment | info | Admin is reviewing submitted payment proof |
| `reupload_payment_proof` | Reupload Payment | error | Payment proof was rejected, customer needs to resubmit |
| `processing` | Processing | info | Order is being prepared |
| `for_delivery` | For Delivery | info | Order ready for delivery |
| `for_pickup` | For Pickup | info | Order ready for pickup |
| `completed` | Completed | success | Order has been completed |
| `cancelled` | Cancelled | error | Order was cancelled |

## Customer Interface

### Issue Ticket Tracking
- **Location**: `Customer Dashboard → Ticket History`
- **Features**:
  - View all submitted tickets with current status
  - Filter tickets by status
  - Search tickets by ID, title, or status
  - View creation and last update times
  - Click to open ticket details or resume chat

### Status Display for Customers
- Badges with appropriate color coding
- Human-readable status text
- Timestamps for creation and updates
- Clear indication of pending actions

## Admin Interface

### Ticket Review System
- **Location**: `Admin Dashboard → Tickets`
- **Features**:
  - View all customer tickets
  - Filter by status, customer type (urgent for valued customers)
  - Sort by date received or last updated
  - Quick action buttons to open chat interface
  - Bulk status updates

### Status Management
- Dropdown selectors for status changes
- Status change tracking with timestamps
- Automatic status transitions based on chat activity
- Manual override capabilities for special cases

## Color Coding System

### Badge Variants
- **Info** (`info`): Light blue - Initial or active states
- **Warning** (`warning`): Yellow/orange - Action required or in progress
- **Success** (`success`): Green - Completed or successful states
- **Error** (`error`): Red - Requires immediate attention or negative outcomes
- **Secondary** (`secondary`): Gray - Inactive or final states

### Consistent Application
- All status-related UI elements use the same color scheme
- Status colors are consistent across customer and admin interfaces
- High contrast for accessibility
- Clear visual hierarchy

## Technical Implementation

### Shared Utilities
- **Location**: `src/shared/utils/statusColors.ts`
- **Functions**:
  - `getTicketStatusBadgeVariant(status: string)`
  - `getOrderStatusBadgeVariant(status: string)`
  - `getQuoteStatusBadgeVariant(status: string)`
  - `getServiceStatusBadgeVariant(status: string)`

### Status Formatters
- **Location**: `src/shared/utils/statusFormatter.ts`
- **Functions**:
  - `formatTicketStatus(status: string)`
  - `formatOrderStatus(status: string)`
  - `formatQuoteStatus(status: string)`
  - `formatStatus(status: string)` (generic)

## Best Practices

### Status Updates
1. **Automatic Transitions**: When possible, trigger status changes based on system events
2. **Manual Overrides**: Allow admin to manually adjust statuses as needed
3. **Audit Trail**: Track who changed status and when
4. **Notifications**: Send appropriate notifications for status changes

### UI/UX Guidelines
1. **Consistent Language**: Use the same status terminology across all interfaces
2. **Clear Indicators**: Make it obvious what action is required for each status
3. **Loading States**: Show appropriate loading indicators during status transitions
4. **Error Handling**: Provide clear feedback if status updates fail

### Database Integrity
1. **Constraint Validation**: Always validate status values against database constraints
2. **Transaction Safety**: Use transactions for multi-table status updates
3. **Rollback Capability**: Implement rollback mechanisms for failed status changes

## Migration Notes

### Previous Status Systems
- **Old inquiry statuses**: `open`, `in_progress`, `not resolved` have been removed
- **New inquiry statuses**: `under_review`, `pending_customer_reply`, `pending_admin_reply` added
- **Order status alignment**: Fixed `reupload_payment` vs `reupload_payment_proof` inconsistency

### Import Path Changes
- **From**: `@admin/utils/statusColors`
- **To**: `@shared/utils/statusColors`
- **Backward Compatibility**: Admin index file re-exports for smooth transition

## Testing Considerations

### Status Flow Testing
1. Test all valid status transitions
2. Verify invalid status changes are rejected
3. Test automatic status triggers
4. Verify UI updates reflect status changes immediately

### Cross-Platform Testing
1. Verify status display on desktop, tablet, and mobile
2. Test color contrast and accessibility
3. Verify badge rendering across different browsers
4. Test responsive layout with status badges

## Future Enhancements

### Planned Improvements
1. **Custom Status Definitions**: Allow admin to define custom statuses
2. **Status Workflows**: Define custom status flow transitions
3. **Automated Notifications**: Enhanced notification system for status changes
4. **Analytics Dashboard**: Status tracking and reporting features

### Extension Points
1. **Plugin Architecture**: Allow custom status handlers
2. **Webhook Support**: External system integration for status updates
3. **API Endpoints**: RESTful API for status management
4. **Bulk Operations**: Enhanced bulk status update capabilities