import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Card,
  Text,
  Button,
  Input,
  Badge,
  Modal,
  ToastContainer,
} from '@shared/components';
import {
  CustomerService,
  type CustomerSearchResult,
} from '@admin/services/customerService';
import {
  ProfileService,
  type CustomerProfile,
} from '@customer/services/profileService';
import { formatCustomerType } from '@shared/utils/statusFormatter';
import { useToast } from '@lib/useToast';
import { Search, User, Mail, Phone, Loader2, MapPin, X } from 'lucide-react';

interface CustomerTypeManagementProps {
  onUpdate?: () => void;
}

const CustomerTypeManagement: React.FC<CustomerTypeManagementProps> = ({
  onUpdate,
}) => {
  const [toasts, toast] = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>(
    []
  );
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCustomerType, setPendingCustomerType] = useState<
    'regular' | 'valued' | null
  >(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      // Only clear search results when query is empty
      // Don't clear selectedCustomer here - it should persist until explicitly cleared
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await CustomerService.searchCustomers(searchQuery);
        setSearchResults(results);
      } catch (error) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectCustomer = useCallback(
    async (customer: CustomerSearchResult) => {
      setIsLoadingCustomer(true);

      try {
        const profile = await ProfileService.getProfile(customer.customer_id);

        if (profile) {
          const normalizedProfile = {
            ...profile,
            customer_type: (profile.customer_type || 'regular')
              .toLowerCase()
              .trim(),
          };
          setSelectedCustomer(normalizedProfile);
          setSearchQuery('');
          setSearchResults([]);
        } else {
          toast.error(
            'Error',
            'Failed to load customer details. Please try again.'
          );
        }
      } catch (error) {
        toast.error(
          'Error',
          error instanceof Error
            ? error.message
            : 'An error occurred while loading customer details.'
        );
      } finally {
        setIsLoadingCustomer(false);
      }
    },
    [toast]
  );

  const handleChangeTypeClick = useCallback(() => {
    if (!selectedCustomer) return;

    // Customer type is already normalized in the service (lowercase 'regular' or 'valued')
    const currentType = selectedCustomer.customer_type || 'regular';

    // Only allow changing from regular to valued (one-way operation)
    if (currentType !== 'regular') {
      return;
    }

    setPendingCustomerType('valued');
    setShowConfirmModal(true);
  }, [selectedCustomer]);

  const handleConfirmUpdate = useCallback(async () => {
    if (!selectedCustomer || !pendingCustomerType) return;

    setIsUpdating(true);

    try {
      const result = await CustomerService.updateCustomerType(
        selectedCustomer.customer_id,
        pendingCustomerType
      );

      if (result.success) {
        // Verify the update by refetching the profile
        try {
          const updatedProfile = await ProfileService.getProfile(
            selectedCustomer.customer_id
          );

          if (updatedProfile) {
            const normalizedProfile = {
              ...updatedProfile,
              customer_type: (updatedProfile.customer_type || 'regular')
                .toLowerCase()
                .trim(),
            };
            setSelectedCustomer(normalizedProfile);
          } else {
            // Fallback: update local state if refetch fails
            setSelectedCustomer({
              ...selectedCustomer,
              customer_type: pendingCustomerType,
            });
          }
        } catch (refetchError) {
          console.error('Error refetching profile:', refetchError);
          // Still update local state even if refetch fails
          setSelectedCustomer({
            ...selectedCustomer,
            customer_type: pendingCustomerType,
          });
        }

        setShowConfirmModal(false);
        setPendingCustomerType(null);
        toast.success(
          'Customer type updated',
          `Customer type successfully changed to ${formatCustomerType(pendingCustomerType)}`
        );
        onUpdate?.();
      } else {
        console.error('Update failed:', result.error);
        toast.error(
          'Update failed',
          result.error || 'Failed to update customer type'
        );
      }
    } catch (error) {
      console.error('Error updating customer type:', error);
      toast.error(
        'Error',
        error instanceof Error
          ? error.message
          : 'An error occurred while updating customer type'
      );
    } finally {
      setIsUpdating(false);
    }
  }, [selectedCustomer, pendingCustomerType, onUpdate, toast]);

  const handleClearSelection = useCallback(() => {
    setSelectedCustomer(null);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  const getDisplayName = (customer: CustomerSearchResult | CustomerProfile) => {
    const firstName = customer.first_name || '';
    const lastName = customer.last_name || '';
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return customer.email_address || 'Unknown Customer';
  };

  const getInitials = (customer: CustomerSearchResult | CustomerProfile) => {
    const firstName = customer.first_name || '';
    const lastName = customer.last_name || '';
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName[0].toUpperCase();
    }
    if (customer.email_address) {
      return customer.email_address[0].toUpperCase();
    }
    return '?';
  };

  const formatAddress = (address: CustomerProfile['address']): string => {
    if (!address) return 'No address on file';
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
    <>
      <Card className="device-spacing-component">
        <div className="mb-4">
          <Text variant="h3" className="device-text-heading" weight="semibold">
            Customer Role Management
          </Text>
          <Text variant="p" className="device-text-body text-neutral-600 mt-1">
            Search for customers and update their customer role (Regular to
            Valued)
          </Text>
        </div>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by email, name, or customer ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
              ) : (
                <Search className="h-4 w-4 text-neutral-400" />
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && !selectedCustomer && (
            <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-200 max-h-60 overflow-y-auto">
              {searchResults.map(customer => (
                <button
                  key={customer.customer_id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-brand-primary text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {getInitials(customer)}
                      </div>
                      <div>
                        <Text
                          variant="span"
                          className="device-text-body"
                          weight="medium"
                        >
                          {getDisplayName(customer)}
                        </Text>
                        <Text
                          variant="p"
                          className="device-text-caption text-neutral-600"
                        >
                          {customer.email_address}
                        </Text>
                      </div>
                    </div>
                    <Badge
                      variant={
                        customer.customer_type === 'valued' ? 'warning' : 'info'
                      }
                      size="sm"
                      className="device-badge-sm"
                    >
                      {formatCustomerType(customer.customer_type || 'regular')}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Customer Details */}
          {selectedCustomer && (
            <div className="border border-neutral-200 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-brand-primary text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {getInitials(selectedCustomer)}
                  </div>
                  <div>
                    <Text
                      variant="h4"
                      className="device-text-heading"
                      weight="semibold"
                    >
                      {getDisplayName(selectedCustomer)}
                    </Text>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={
                          selectedCustomer.customer_type === 'valued'
                            ? 'warning'
                            : 'info'
                        }
                        size="sm"
                        className="device-badge-sm"
                      >
                        {formatCustomerType(
                          selectedCustomer.customer_type || 'regular'
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                >
                  Clear
                </Button>
              </div>

              <div className="space-y-3 pt-2 border-t border-neutral-200">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <Text
                      variant="span"
                      className="device-text-caption text-neutral-500"
                      weight="medium"
                    >
                      Email:
                    </Text>
                    <Text
                      variant="p"
                      className="device-text-body text-neutral-600 break-words"
                    >
                      {selectedCustomer.email_address || 'Not provided'}
                    </Text>
                  </div>
                </div>
                {selectedCustomer.contact_no && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <Text
                        variant="span"
                        className="device-text-caption text-neutral-500"
                        weight="medium"
                      >
                        Phone:
                      </Text>
                      <Text
                        variant="p"
                        className="device-text-body text-neutral-600 break-words"
                      >
                        {selectedCustomer.contact_no}
                      </Text>
                    </div>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <Text
                        variant="span"
                        className="device-text-caption text-neutral-500"
                        weight="medium"
                      >
                        Address:
                      </Text>
                      <Text
                        variant="p"
                        className="device-text-body text-neutral-600 break-words"
                      >
                        {formatAddress(selectedCustomer.address)}
                      </Text>
                    </div>
                  </div>
                )}
              </div>

              {/* Change Type Actions */}
              <div className="pt-4 border-t border-neutral-200">
                {selectedCustomer.customer_type === 'regular' ? (
                  <>
                    <Text
                      variant="span"
                      className="device-text-body mb-3 block"
                      weight="medium"
                    >
                      Change Customer Type:
                    </Text>
                    <Button
                      variant="secondary"
                      onClick={handleChangeTypeClick}
                      disabled={isUpdating}
                      className="w-full"
                    >
                      Change to Valued
                    </Button>
                  </>
                ) : (
                  <div className="bg-info-50 border border-info-200 rounded-lg p-3">
                    <Text
                      variant="p"
                      className="device-text-body text-info-700"
                      size="sm"
                    >
                      This customer is already a valued customer. Changes are
                      one-way only (regular to valued).
                    </Text>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Loading Customer Details */}
          {isLoadingCustomer && !selectedCustomer && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
              <Text
                variant="span"
                className="device-text-body text-neutral-600 ml-2"
              >
                Loading customer details...
              </Text>
            </div>
          )}

          {/* No Results Message */}
          {searchQuery.trim() &&
            searchResults.length === 0 &&
            !isSearching &&
            !selectedCustomer && (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-neutral-300 mx-auto mb-2" />
                <Text variant="p" className="device-text-body text-neutral-600">
                  No customers found
                </Text>
                <Text
                  variant="p"
                  className="device-text-caption text-neutral-500 mt-1"
                >
                  Try searching by email, name, or customer ID
                </Text>
              </div>
            )}
        </div>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          if (!isUpdating) {
            setShowConfirmModal(false);
            setPendingCustomerType(null);
          }
        }}
        size="sm"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200">
          <div className="flex items-center justify-between p-6 pb-4">
            <Text variant="h3" size="lg" weight="semibold">
              Confirm Customer Type Change
            </Text>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!isUpdating) {
                  setShowConfirmModal(false);
                  setPendingCustomerType(null);
                }
              }}
              className="ml-4 h-8 w-8 p-0 hover:bg-neutral-100"
              aria-label="Close"
              disabled={isUpdating}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-6 pb-4">
            <Text variant="p">
              Are you sure you want to upgrade{' '}
              <strong>
                {selectedCustomer
                  ? getDisplayName(selectedCustomer)
                  : 'this customer'}
              </strong>
              's customer type from{' '}
              <strong>
                {formatCustomerType(
                  selectedCustomer?.customer_type || 'regular'
                )}
              </strong>{' '}
              to{' '}
              <strong>
                {formatCustomerType(pendingCustomerType || 'valued')}
              </strong>
              ?
              <br />
              <br />
              This change is permanent and cannot be reversed.
            </Text>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowConfirmModal(false);
                setPendingCustomerType(null);
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmUpdate} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>

      <ToastContainer
        toasts={toasts}
        onRemoveToast={toast.remove}
        position="bottom-right"
      />
    </>
  );
};

export default CustomerTypeManagement;
