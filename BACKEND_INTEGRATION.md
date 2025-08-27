# Backend Integration Guide

This document outlines the steps needed to integrate real backend functionality with the Printy application, replacing all mock data and prototype functionality.

## 🔗 Quick Links

- [Account Settings Integration Plan](#-account-settings-integration-plan)
- [TODO(BACKEND) Summary From Codebase](#-todobackend-summary-from-codebase)

## 🎯 Overview

The application currently has a complete UI and chat system but uses mock data for:

- Authentication (hardcoded credentials)
- User management
- Order tracking
- Support tickets
- Data persistence

## 🧩 Account Settings Integration Plan

Files with TODO markers:

- `src/pages/customer/accountSettings/AccountSettingsPage.tsx`
- `src/components/customer/accountSettings/PersonalInfoForm.tsx`
- `src/components/customer/accountSettings/SecuritySettings.tsx`

### Data model (Supabase tables)

- `profiles` (or extend existing): id, email, display_name, phone, address, city, zip_code, avatar_url
- `preferences` (by user): email_notifications, sms_notifications, order_updates, chat_messages, ticket_updates

### Services (client-side)

Create `src/lib/services/account.ts` (suggested) with:

```ts
// TODO: implement with Supabase client
export const AccountService = {
  async getProfile() {}, // returns profile
  async updateProfile(partial) {},
};

export const PreferencesService = {
  async get() {},
  async set(key, value) {},
  async updateAll(prefs) {},
};

export const SecurityService = {
  async changePassword(current, next) {},
  async enable2FA() {},
};
```

Wire these in the following locations:

- Page mount → `getProfile`, `get()`; hydrate UI state
- PersonalInfoForm `onSave` → `updateProfile(partial)`; optimistic UI + toasts
- NotificationPreferences `onToggle` → `set(key, value)`; toast on result
- SecuritySettings confirm → `changePassword(current, next)`; call `onPasswordUpdated` on success

### Error handling

- Use existing toasts/modals; only close on success
- Show error toast on failure and keep forms open

### Security notes

- Enforce RLS on `profiles` and `preferences`
- Scope reads/writes to the authenticated user

## 📋 Phase 1: Authentication & User Management

### 1.1 Supabase Setup

- [ ] Create Supabase project
- [ ] Configure authentication providers (email, Google OAuth)
- [ ] Set up Row Level Security (RLS) policies
- [ ] Configure email templates for verification/reset

### 1.2 Database Schema - Users & Profiles

```sql
-- Profiles table (extends Supabase Auth users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer-not-to-say')),
  birthday DATE,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'valued', 'admin', 'superadmin')),
  address JSONB,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );
```

### 1.3 Implementation Tasks

- [ ] Replace hardcoded credentials in `SignIn.tsx`
- [ ] Implement real Supabase authentication
- [ ] Add JWT token management
- [ ] Implement user session persistence
- [ ] Add role-based routing
- [ ] Update `SignUp.tsx` to create real user profiles
- [ ] Implement email verification flow
- [ ] Update `ResetPassword.tsx` with real password reset
- [ ] Add Google OAuth integration

### 1.4 Files to Update

- `src/pages/auth/SignIn.tsx` - Lines 25-80
- `src/pages/auth/SignUp.tsx` - Lines 25-100
- `src/pages/auth/ResetPassword.tsx` - Lines 25-50
- `src/pages/customer/Dashboard.tsx` - Lines 25-60, 350-380

## 📋 Phase 2: Database & Data Models

### 2.1 Core Tables

```sql
-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  email TEXT NOT NULL,
  phone TEXT,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partially_paid', 'refunded', 'failed')),
  fulfillment_status TEXT DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled', 'shipped', 'delivered')),
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  notes TEXT,
  tags TEXT[],
  source TEXT DEFAULT 'web',
  currency TEXT DEFAULT 'PHP',
  processed_at TIMESTAMP WITH TIME ZONE,
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT,
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  guest_id TEXT, -- For guest users
  topic TEXT NOT NULL,
  flow_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES profiles(id),
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id),
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'bot', 'agent')),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'form_response')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 Implementation Tasks

- [ ] Create database schema
- [ ] Set up RLS policies for all tables
- [ ] Create database triggers for timestamps
- [ ] Add data validation and sanitization
- [ ] Implement proper foreign key relationships

## 📋 Phase 3: Chat System Enhancement

### 3.1 Real-time Chat

- [ ] Implement conversation persistence to database
- [ ] Add real-time updates with Supabase subscriptions
- [ ] Store chat context and state
- [ ] Add proper error handling and retry logic
- [ ] Implement file upload capabilities
- [ ] Add chat history and search functionality

### 3.2 Files to Update

- `src/types/chatFlow.ts` - Lines 1-10
- `src/chatLogic/customer/index.ts` - Add database integration
- `src/chatLogic/guest/index.ts` - Add database integration

### 3.3 Implementation Example

```typescript
// In chatLogic/customer/index.ts
export async function persistConversation(conversation: Conversation) {
  const { data, error } = await supabase.from('conversations').insert({
    user_id: getCurrentUserId(),
    topic: conversation.title,
    flow_id: conversation.flowId,
    status: conversation.status,
  });

  if (error) throw error;
  return data;
}

export async function persistMessage(
  message: ChatMessage,
  conversationId: string
) {
  const { data, error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: getCurrentUserId(),
    sender_type: message.role === 'printy' ? 'bot' : 'user',
    content: message.text,
    message_type: 'text',
  });

  if (error) throw error;
  return data;
}
```

## 📋 Phase 4: Order Management

### 4.1 Implementation Tasks

- [ ] Create order creation flow
- [ ] Implement payment processing
- [ ] Add order status tracking
- [ ] Create invoice generation
- [ ] Add order history and search

### 4.2 Files to Update

- `src/pages/customer/Dashboard.tsx` - Replace mock order data
- `src/types/index.ts` - Align with database schema

## 📋 Phase 5: Admin & Superadmin Features

### 5.1 Implementation Tasks

- [ ] Admin dashboard for order management
- [ ] User management interface
- [ ] Analytics and reporting
- [ ] System configuration

## 🔧 Technical Implementation Notes

### 5.1 Authentication Flow

```typescript
// Example authentication implementation
import { supabase } from '../../lib/supabase';

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  return { user: data.user, profile };
};
```

### 5.2 Real-time Subscriptions

```typescript
// Example real-time chat subscription
export const subscribeToConversation = (
  conversationId: string,
  callback: (message: any) => void
) => {
  return supabase
    .channel(`conversation:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      callback
    )
    .subscribe();
};
```

### 5.3 Error Handling

```typescript
// Example error handling pattern
export const handleApiError = (error: any) => {
  if (error.code === 'PGRST116') {
    return 'Record not found';
  }
  if (error.code === '23505') {
    return 'Duplicate entry';
  }
  return error.message || 'An unexpected error occurred';
};
```

## 🚀 Deployment Checklist

### 5.1 Environment Variables

```bash
# Required for production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=Printy
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
```

### 5.2 Database Migration

- [ ] Create migration scripts
- [ ] Test migrations in staging
- [ ] Backup production data
- [ ] Run migrations in production

### 5.3 Testing

- [ ] Unit tests for authentication
- [ ] Integration tests for chat flows
- [ ] End-to-end tests for user journeys
- [ ] Performance testing for real-time features

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## 🎯 Success Metrics

- [ ] All mock data replaced with real backend
- [ ] Authentication working with real users
- [ ] Chat conversations persisting to database
- [ ] Real-time updates working
- [ ] Orders and tickets properly tracked
- [ ] Performance maintained or improved
- [ ] Security policies properly implemented

## 🧩 TODO(BACKEND) Summary From Codebase

Collected from inline markers to guide implementation order:

- `src/pages/customer/accountSettings/AccountSettingsPage.tsx`
  - Replace local state with Supabase-fetched profile and preferences
  - Fetch profile + preferences on mount and hydrate UI
  - Persist profile changes (PersonalInfoForm onSave)
  - Persist notification preference toggles (onToggle)
- `src/components/customer/accountSettings/PersonalInfoForm.tsx`
  - Wire onSave to profile update service; optimistic update + toasts
  - Optionally refetch latest profile before entering edit mode
- `src/components/customer/accountSettings/SecuritySettings.tsx`
  - Call password change API and handle errors; close modal on success
  - Trigger onPasswordUpdated after success to show toast
  - Implement 2FA enablement flow (placeholder button present)

Refer to the “Account Settings Integration Plan” section above for proposed service shapes and where to connect them.
