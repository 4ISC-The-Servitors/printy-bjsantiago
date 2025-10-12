// Quote API client: New AI-powered quote flow with Cohere

import { supabase } from '../../lib/supabase';
import { generateWithCohere } from './llmClient';
import { buildConversationPrompt, type QuoteAnalysisResult, type SpecData } from '../quote/quoteAssistantPrompt';

export type QuoteStatus = 'active' | 'spec_proposed' | 'accepted' | 'rejected' | 'ended';
export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface ConversationData {
  conversation_id: string;
  customer_id: string;
  admin_id?: string;
  quote_id: string;
  status: QuoteStatus;
  language?: 'tl' | 'en';
  created_at: string;
  updated_at: string;
  ended_at?: string;
}

export interface Message {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'customer' | 'admin' | 'ai';
  message_text: string;
  message_type: 'chat' | 'spec_summary' | 'spec_proposal' | 'system';
  metadata: any;
  sent_at: string;
}

export interface Proposal {
  proposal_id: string;
  conversation_id: string;
  spec_id: string;
  admin_id: string;
  spec_final: SpecData;
  quoted_price: number;
  currency: string;
  notes?: string;
  valid_until?: string;
  status: ProposalStatus;
  created_at: string;
  updated_at: string;
  sent_at?: string;
}

// Conversation management
export async function createQuoteConversation(customerId: string, quoteId?: string): Promise<string> {
  const { data, error } = await supabase
    .rpc('create_quote_conversation', {
      p_customer_id: customerId,
      p_quote_id: quoteId || null
    });

  if (error) throw error;
  return data;
}

export async function fetchConversation(conversationId: string): Promise<ConversationData> {
  const { data, error } = await supabase
    .from('quote_conversations')
    .select('*')
    .eq('conversation_id', conversationId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .rpc('get_conversation_messages', {
      p_conversation_id: conversationId
    });

  if (error) throw error;
  return data;
}

export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  senderRole: 'customer' | 'admin' | 'ai';
  text: string;
  messageType?: 'chat' | 'spec_summary' | 'spec_proposal' | 'system';
  metadata?: any;
}): Promise<string> {
  const { data, error } = await supabase
    .rpc('add_quote_message', {
      p_conversation_id: params.conversationId,
      p_sender_id: params.senderId,
      p_sender_role: params.senderRole,
      p_message_text: params.text,
      p_message_type: params.messageType || 'chat',
      p_metadata: params.metadata || {}
    });

  if (error) throw error;
  return data;
}

// AI spec generation
export async function summarizeConversation(conversationId: string, adminId: string): Promise<{
  specId: string;
  specData: SpecData;
  language: 'tl' | 'en';
}> {
  // Fetch all messages from the conversation
  const messages = await fetchMessages(conversationId);
  
  // Convert to format expected by AI
  const conversationMessages = messages.map(m => ({
    role: m.sender_role === 'customer' ? 'user' : 'assistant',
    text: m.message_text
  }));

  // Build prompt and call Cohere
  const prompt = buildConversationPrompt(conversationMessages);
  const result: QuoteAnalysisResult = await generateWithCohere([
    { role: 'user', content: prompt }
  ], true);

  // Save the AI-generated spec
  const { data: specData, error: specError } = await supabase
    .from('quote_specs')
    .insert({
      conversation_id: conversationId,
      spec_data: result.spec,
      triggered_by_admin_id: adminId
    })
    .select('spec_id')
    .single();

  if (specError) throw specError;

  // Update conversation language
  await supabase
    .from('quote_conversations')
    .update({ language: result.language })
    .eq('conversation_id', conversationId);

  return {
    specId: specData.spec_id,
    specData: result.spec,
    language: result.language
  };
}

// Proposal management
export async function createProposal(params: {
  conversationId: string;
  specId: string;
  adminId: string;
  specFinal: SpecData;
  quotedPrice: number;
  notes?: string;
  validUntil?: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from('quote_proposals')
    .insert({
      conversation_id: params.conversationId,
      spec_id: params.specId,
      admin_id: params.adminId,
      spec_final: params.specFinal,
      quoted_price: params.quotedPrice,
      notes: params.notes,
      valid_until: params.validUntil,
      status: 'draft'
    })
    .select('proposal_id')
    .single();

  if (error) throw error;
  return data.proposal_id;
}

export async function sendProposalToCustomer(proposalId: string): Promise<void> {
  const { error } = await supabase
    .from('quote_proposals')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString()
    })
    .eq('proposal_id', proposalId);

  if (error) throw error;

  // Update conversation status
  const { data: proposal } = await supabase
    .from('quote_proposals')
    .select('conversation_id')
    .eq('proposal_id', proposalId)
    .single();

  if (proposal) {
    await supabase
      .from('quote_conversations')
      .update({ status: 'spec_proposed' })
      .eq('conversation_id', proposal.conversation_id);
  }
}

export async function acceptProposal(proposalId: string): Promise<void> {
  const { error } = await supabase
    .from('quote_proposals')
    .update({ status: 'accepted' })
    .eq('proposal_id', proposalId);

  if (error) throw error;

  // Update conversation status
  const { data: proposal } = await supabase
    .from('quote_proposals')
    .select('conversation_id')
    .eq('proposal_id', proposalId)
    .single();

  if (proposal) {
    await supabase
      .from('quote_conversations')
      .update({ status: 'accepted' })
      .eq('conversation_id', proposal.conversation_id);
  }
}

export async function rejectProposal(proposalId: string, reason?: string): Promise<void> {
  const { error } = await supabase
    .from('quote_proposals')
    .update({ 
      status: 'rejected',
      notes: reason ? `Rejected: ${reason}` : 'Rejected'
    })
    .eq('proposal_id', proposalId);

  if (error) throw error;

  // Update conversation status
  const { data: proposal } = await supabase
    .from('quote_proposals')
    .select('conversation_id')
    .eq('proposal_id', proposalId)
    .single();

  if (proposal) {
    await supabase
      .from('quote_conversations')
      .update({ status: 'rejected' })
      .eq('conversation_id', proposal.conversation_id);
  }
}

// Order conversion
export async function convertProposalToOrder(proposalId: string): Promise<string> {
  // This would integrate with your existing order system
  // For now, return a placeholder
  throw new Error('convertProposalToOrder not yet implemented');
}

// Helper functions
export async function fetchProposals(conversationId: string): Promise<Proposal[]> {
  const { data, error } = await supabase
    .from('quote_proposals')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchRecentQuoteConversations(customerId: string): Promise<ConversationData[]> {
  const { data, error } = await supabase
    .from('quote_conversations')
    .select('*')
    .eq('customer_id', customerId)
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data;
}
