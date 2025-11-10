import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, Text, Button } from '@shared/components';
import { X, Phone, Mail, MapPin, User } from 'lucide-react';
import {
  ProfileService,
  type CustomerProfile,
} from '@customer/services/profileService';

interface CustomerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string | null;
  customerName?: string;
}

const CustomerInfoModal: React.FC<CustomerInfoModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
}) => {
  const [currentCustomer, setCurrentCustomer] =
    useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadCustomerInfo = useCallback(
    async (id: string) => {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      // Note: This won't actually cancel the Supabase request, but prevents state updates
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setLoading(true);
      setError(null);

      try {
        const profile = await ProfileService.getProfile(id);

        // Only update state if modal is still open, request wasn't aborted, and customerId still matches
        if (!abortController.signal.aborted && id === customerId && isOpen) {
          if (profile) {
            setCurrentCustomer(profile);
          } else {
            setError('Customer information not found');
          }
        }
      } catch (err) {
        // Only set error if modal is still open, request wasn't aborted, and customerId still matches
        if (!abortController.signal.aborted && id === customerId && isOpen) {
          // Don't set error if it was an abort error
          if (err instanceof Error && err.name !== 'AbortError') {
            console.error('Error loading customer info:', err);
            setError(err.message || 'Failed to load customer information');
          }
        }
      } finally {
        // Only update loading state if modal is still open, request wasn't aborted, and customerId still matches
        if (!abortController.signal.aborted && id === customerId && isOpen) {
          setLoading(false);
        }
        // Clear the ref if this was the current request
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
        }
      }
    },
    [customerId, isOpen]
  );

  // Load current customer information only when modal opens
  useEffect(() => {
    // Only fetch when modal is opened and customerId is provided
    if (!isOpen) {
      // Clear state when modal closes to avoid showing stale data
      setCurrentCustomer(null);
      setError(null);
      setLoading(false);
      // Mark request as cancelled to prevent state updates
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      return;
    }

    // Only fetch if we have a customerId
    if (customerId) {
      loadCustomerInfo(customerId);
    } else {
      setCurrentCustomer(null);
      setError('No customer ID provided');
    }

    // Cleanup: cancel request if component unmounts or modal closes
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [isOpen, customerId, loadCustomerInfo]);

  const formatAddress = (address: CustomerProfile['address']): string => {
    const parts: string[] = [];
    if (address.building_name) parts.push(address.building_name);
    if (address.street_name) parts.push(address.street_name);
    if (address.barangay_name) parts.push(address.barangay_name);
    if (address.city_name) parts.push(address.city_name);
    if (address.province_name) parts.push(address.province_name);
    if (address.region_name) parts.push(address.region_name);
    if (address.zip_code) parts.push(address.zip_code);
    return parts.length > 0 ? parts.join(', ') : 'No address on file';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200">
        <div className="device-spacing-component pt-4 pb-2">
          <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2">
            <Text
              variant="h3"
              size="xl"
              weight="semibold"
              className="flex-1 min-w-0"
              truncate
            >
              Customer Information
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 sm:h-10 sm:w-10 p-0 hover:bg-neutral-100 flex-shrink-0 touch-target"
              aria-label="Close"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>

        <div className="device-spacing-component pb-4">
          {loading ? (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
              <Text variant="p" size="base" color="muted">
                Loading customer information...
              </Text>
            </div>
          ) : error ? (
            <div className="bg-red-50 rounded-lg border border-red-200 p-4 text-center">
              <Text variant="p" size="base" className="text-red-700">
                {error}
              </Text>
            </div>
          ) : currentCustomer ? (
            <div className="space-y-3 sm:space-y-4">
              {/* Customer Name */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 sm:p-4">
                <Text
                  variant="p"
                  size="sm"
                  weight="semibold"
                  color="muted"
                  className="mb-2 sm:mb-3 uppercase tracking-wide"
                >
                  Customer Details
                </Text>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <Text variant="p" size="xs" weight="medium" color="muted">
                        Name:
                      </Text>
                      <Text variant="p" size="base" className="break-words">
                        {`${currentCustomer.first_name} ${currentCustomer.last_name}`.trim() ||
                          'Not provided'}
                      </Text>
                    </div>
                  </div>

                  {currentCustomer.email_address && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <Text
                          variant="p"
                          size="xs"
                          weight="medium"
                          color="muted"
                        >
                          Email:
                        </Text>
                        <Text variant="p" size="base" className="break-words">
                          {currentCustomer.email_address}
                        </Text>
                      </div>
                    </div>
                  )}

                  {currentCustomer.contact_no && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <Text
                          variant="p"
                          size="xs"
                          weight="medium"
                          color="muted"
                        >
                          Phone:
                        </Text>
                        <Text variant="p" size="base" className="break-words">
                          {currentCustomer.contact_no}
                        </Text>
                      </div>
                    </div>
                  )}

                  {currentCustomer.customer_type && (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <Text
                          variant="p"
                          size="xs"
                          weight="medium"
                          color="muted"
                        >
                          Customer Type:
                        </Text>
                        <Text
                          variant="p"
                          size="base"
                          className="break-words capitalize"
                        >
                          {currentCustomer.customer_type}
                        </Text>
                      </div>
                    </div>
                  )}

                  {currentCustomer.gender && (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <Text
                          variant="p"
                          size="xs"
                          weight="medium"
                          color="muted"
                        >
                          Gender:
                        </Text>
                        <Text
                          variant="p"
                          size="base"
                          className="break-words capitalize"
                        >
                          {currentCustomer.gender}
                        </Text>
                      </div>
                    </div>
                  )}

                  {currentCustomer.birthday && (
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <Text
                          variant="p"
                          size="xs"
                          weight="medium"
                          color="muted"
                        >
                          Birthday:
                        </Text>
                        <Text variant="p" size="base" className="break-words">
                          {new Date(
                            currentCustomer.birthday
                          ).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Text>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 sm:p-4">
                <Text
                  variant="p"
                  size="sm"
                  weight="semibold"
                  color="muted"
                  className="mb-2 sm:mb-3 uppercase tracking-wide"
                >
                  Address
                </Text>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <Text variant="p" size="base" className="break-words">
                      {formatAddress(currentCustomer.address)}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
              <Text variant="p" size="base" color="muted">
                {customerName
                  ? `Customer: ${customerName} (ID not available)`
                  : 'No customer information available.'}
              </Text>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CustomerInfoModal;
