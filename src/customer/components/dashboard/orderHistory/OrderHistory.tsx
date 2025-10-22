import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@lib/supabase';
import DesktopLayout from '@customer/components/shared/layouts/DesktopLayout';
import MobileLayout from '@customer/components/shared/layouts/MobileLayout';
import SidebarPanel from '@customer/components/shared/sidebar/SidebarPanel';
import LogoutButton from '@customer/components/shared/sidebar/LogoutButton';
import LogoutModal from '@customer/components/shared/sidebar/LogoutModal';
import PayNowButton from '@customer/components/dashboard/recentOrders/PayNowButton';
import ReuploadPaymentButton from '@customer/components/dashboard/recentOrders/ReuploadPaymentButton';
import { Text, Badge, Button } from '@shared/components';
import { formatOrderStatus } from '@shared/utils/statusFormatter';
import { formatLongDate } from '@shared/utils/dateFormatter';
import { formatRelativeTimeLabel } from '@shared/utils/timeFormatter';
import {
  useRecentChatSessions,
  type ConversationLike,
} from '@customer/hooks/useRecentChatSessions';

interface Order {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  status: string;
  displayId: string;
  total?: string;
  order_specs?: any;
  paymentVerifiedAt?: number;
  completedAt?: number;
}

const OrderHistory: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [conversations, setConversations] = useState<ConversationLike[]>([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load conversations for sidebar
  useRecentChatSessions(setConversations);

  // Load orders from database
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('orders')
          .select(
            `
            order_id,
            display_id,
            status,
            created_at,
            updated_at,
            total_amount,
            order_specs,
            payment_verified_at,
            completed_at
          `
          )
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading orders:', error);
          return;
        }

        const orderList: Order[] = (data || []).map(order => ({
          id: order.order_id,
          title: order.order_specs?.product_name || 'Order',
          createdAt: new Date(order.created_at).getTime(),
          updatedAt: new Date(order.updated_at).getTime(),
          status: order.status,
          displayId: order.display_id || order.order_id,
          total: order.total_amount
            ? `₱${Number(order.total_amount).toLocaleString()}`
            : undefined,
          order_specs: order.order_specs,
          paymentVerifiedAt: order.payment_verified_at
            ? new Date(order.payment_verified_at).getTime()
            : undefined,
          completedAt: order.completed_at
            ? new Date(order.completed_at).getTime()
            : undefined,
        }));

        setOrders(orderList);
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    };

    loadOrders();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(order => {
      const matchesQuery = q
        ? order.title.toLowerCase().includes(q) ||
          order.displayId.toLowerCase().includes(q) ||
          order.status.toLowerCase().includes(q)
        : true;
      const matchesStatus = status ? order.status === status : true;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, status]);

  const handleItemClick = (order: Order) => {
    // Navigate to order details or open chat for this order
    alert(`Order ${order.displayId} clicked`);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    navigate('/auth/signin');
  };

  const sidebar = (
    <SidebarPanel
      conversations={conversations}
      activeId={null}
      onSwitchConversation={(id: string) => {
        window.dispatchEvent(
          new CustomEvent('customer-open-session', {
            detail: { sessionId: id },
          })
        );
        navigate('/customer');
      }}
      onNavigateToAccount={() => navigate('/customer/account')}
      bottomActions={<LogoutButton onClick={() => setShowLogoutModal(true)} />}
    />
  );

  const renderOrderItem = (order: Order) => (
    <div
      key={order.id}
      className="bg-white rounded-lg border border-neutral-200 p-4 hover:border-brand-primary-300 transition-colors cursor-pointer"
      onClick={() => handleItemClick(order)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Text
              variant="h3"
              size="base"
              weight="semibold"
              className="font-mono"
            >
              {order.displayId}
            </Text>
            <Badge variant="secondary" size="sm">
              {formatOrderStatus(order.status)}
            </Badge>
          </div>

          <Text variant="p" size="sm" color="muted" className="mb-3">
            {order.title}
          </Text>

          {/* Important dates */}
          <div className="flex flex-col gap-1 mb-3">
            <div className="flex justify-between">
              <Text variant="p" size="xs" color="muted">
                Created:
              </Text>
              <Text variant="p" size="xs" color="muted">
                {formatLongDate(order.createdAt)}
              </Text>
            </div>
            <div className="flex justify-between">
              <Text variant="p" size="xs" color="muted">
                Updated:
              </Text>
              <Text variant="p" size="xs" color="muted">
                {formatRelativeTimeLabel(order.updatedAt)}
              </Text>
            </div>
            {order.paymentVerifiedAt && (
              <div className="flex justify-between">
                <Text variant="p" size="xs" color="muted">
                  Payment Verified:
                </Text>
                <Text variant="p" size="xs" color="muted">
                  {formatLongDate(order.paymentVerifiedAt)}
                </Text>
              </div>
            )}
            {order.completedAt && (
              <div className="flex justify-between">
                <Text variant="p" size="xs" color="muted">
                  Completed:
                </Text>
                <Text variant="p" size="xs" color="muted">
                  {formatLongDate(order.completedAt)}
                </Text>
              </div>
            )}
          </div>

          {order.total && (
            <Text
              variant="p"
              size="sm"
              weight="medium"
              className="text-brand-primary"
            >
              {order.total}
            </Text>
          )}

          {/* Action buttons */}
          <div className="mt-3">
            {order.status.toLowerCase() === 'awaiting_payment' && (
              <PayNowButton
                orderId={order.id}
                displayId={order.displayId}
                total={order.total}
              />
            )}
            {order.status.toLowerCase() === 'reupload_payment' && (
              <ReuploadPaymentButton
                orderId={order.id}
                displayId={order.displayId}
                total={order.total}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const content = (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/customer')}
            className="text-neutral-600 hover:text-neutral-900"
          >
            ← Back to Dashboard
          </Button>
        </div>
        <Text
          variant="h1"
          size="2xl"
          weight="bold"
          className="text-neutral-900"
        >
          Order History
        </Text>
        <Text variant="p" size="base" color="muted">
          View all your past orders and their current status
        </Text>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search orders..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="awaiting_payment">Awaiting Payment</option>
            <option value="reupload_payment">Reupload Payment</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        {(query || status) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              setStatus('');
            }}
            className="whitespace-nowrap"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Text variant="p" size="base" color="muted">
            {orders.length === 0
              ? 'No orders found.'
              : 'No orders match your filters.'}
          </Text>
        </div>
      ) : (
        <div className="space-y-4">{filtered.map(renderOrderItem)}</div>
      )}

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </>
  );

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <DesktopLayout sidebar={sidebar}>{content}</DesktopLayout>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <MobileLayout sidebar={sidebar}>{content}</MobileLayout>
      </div>
    </>
  );
};

export default OrderHistory;
