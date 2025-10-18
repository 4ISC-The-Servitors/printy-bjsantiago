-- Phase 3 Performance Optimization: Database Views
-- Creates optimized views for common query patterns to reduce N+1 queries
-- Expected impact: 50-100ms savings on complex queries

-- =============================================================================
-- View 1: Quote Details with Proposal Data
-- =============================================================================
-- Consolidates quote session with latest proposal for single-query access
-- Use case: Customer and admin quote detail displays
CREATE OR REPLACE VIEW quote_details_view AS
SELECT
  cs.session_id,
  cs.customer_id,
  cs.flow_id,
  cs.status AS session_status,
  cs.inquiry_id,
  cs.quote_id,
  cs.metadata,
  cs.created_at AS session_created_at,
  cs.updated_at AS session_updated_at,
  -- Latest proposal data (left join as proposals may not exist yet)
  qp.proposal_id,
  qp.spec_final,
  qp.quoted_price,
  qp.status AS proposal_status,
  qp.notes AS proposal_notes,
  qp.created_at AS proposal_created_at,
  qp.updated_at AS proposal_updated_at
FROM chat_sessions_v2 cs
LEFT JOIN LATERAL (
  SELECT *
  FROM quote_proposals
  WHERE quote_proposals.session_id = cs.session_id
  ORDER BY created_at DESC
  LIMIT 1
) qp ON true
WHERE cs.quote_id IS NOT NULL; -- Only include quote-related sessions

COMMENT ON VIEW quote_details_view IS 'Optimized view combining quote sessions with their latest proposal. Eliminates N+1 queries when fetching quote details.';

-- =============================================================================
-- View 2: Session with Metadata and Flow Information
-- =============================================================================
-- Pre-joins session with flow definition for quick access
-- Use case: Flow processing initialization, admin session listings
CREATE OR REPLACE VIEW session_with_flow_view AS
SELECT
  cs.session_id,
  cs.customer_id,
  cs.flow_id,
  cs.status,
  cs.inquiry_id,
  cs.quote_id,
  cs.metadata,
  cs.created_at,
  cs.updated_at,
  -- Flow information
  cf.flow_type,
  cf.display_name AS flow_display_name,
  cf.description AS flow_description,
  cf.flow_definition
FROM chat_sessions_v2 cs
INNER JOIN chat_flows_v2 cf ON cs.flow_id = cf.flow_id;

COMMENT ON VIEW session_with_flow_view IS 'Optimized view combining sessions with flow definitions. Useful for flow initialization and admin dashboards.';

-- =============================================================================
-- View 3: Order with Payment and Customer Details
-- =============================================================================
-- Consolidates order data with payment proofs and customer info
-- Use case: Order verification, payment tracking flows
CREATE OR REPLACE VIEW order_details_view AS
SELECT
  o.order_id,
  o.display_id,
  o.customer_id,
  o.total_amount,
  o.status AS order_status,
  o.created_at AS order_created_at,
  o.updated_at AS order_updated_at,
  -- Customer information
  c.email AS customer_email,
  c.full_name AS customer_name,
  -- Payment information (left join as payments may not exist yet)
  pp.proof_id,
  pp.image_url AS payment_proof_url,
  pp.amount_paid,
  pp.payment_method,
  pp.status AS payment_status,
  pp.uploaded_at,
  pp.verified_at
FROM orders o
INNER JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN LATERAL (
  SELECT *
  FROM payment_proofs
  WHERE payment_proofs.order_id = o.order_id
  ORDER BY uploaded_at DESC
  LIMIT 1
) pp ON true;

COMMENT ON VIEW order_details_view IS 'Optimized view combining orders with customer and payment data. Eliminates multiple queries in payment verification flows.';

-- =============================================================================
-- View 4: Active Chat Sessions with Message Count
-- =============================================================================
-- Provides session overview with message count for admin dashboards
-- Use case: Admin chat management, session monitoring
CREATE OR REPLACE VIEW active_sessions_summary_view AS
SELECT
  cs.session_id,
  cs.customer_id,
  cs.flow_id,
  cs.status,
  cs.created_at,
  cs.updated_at,
  cf.flow_type,
  cf.display_name AS flow_name,
  -- Message statistics
  COALESCE(msg_stats.message_count, 0) AS message_count,
  msg_stats.last_message_at,
  msg_stats.last_sender
FROM chat_sessions_v2 cs
INNER JOIN chat_flows_v2 cf ON cs.flow_id = cf.flow_id
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) AS message_count,
    MAX(created_at) AS last_message_at,
    (SELECT sender FROM chat_messages_v2
     WHERE session_id = cs.session_id
     ORDER BY created_at DESC
     LIMIT 1) AS last_sender
  FROM chat_messages_v2
  WHERE session_id = cs.session_id
) msg_stats ON true
WHERE cs.status = 'active';

COMMENT ON VIEW active_sessions_summary_view IS 'Optimized view for active chat sessions with message statistics. Useful for admin dashboards and monitoring.';

-- =============================================================================
-- Performance Notes:
-- =============================================================================
-- 1. All views use LEFT JOIN LATERAL for optimal performance with subqueries
-- 2. Views automatically benefit from existing indexes on base tables
-- 3. For best performance, query views with WHERE clauses on indexed columns
-- 4. Views are materialized on query execution (not stored), ensuring fresh data
-- 5. Expected performance improvements:
--    - Quote details: 2-3 queries ’ 1 query (50-100ms saved)
--    - Order details: 3-4 queries ’ 1 query (60-120ms saved)
--    - Session with flow: 2 queries ’ 1 query (30-60ms saved)
--    - Active sessions: 2-3 queries per session ’ 1 query total (varies by count)
