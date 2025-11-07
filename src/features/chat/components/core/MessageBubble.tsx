import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bot, User, Image as ImageIcon, ZoomIn, ZoomOut } from 'lucide-react';
import { supabase } from '@lib/supabase';
import Modal from '@shared/components/ui/Modal';
import Text from '@shared/components/ui/Text';
import Container from '@shared/components/layout/Container';

/**
 * Inline image component for rendering images within conversation history
 */
const InlineImage: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 5;
  const ZOOM_STEP = 0.25;
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const getSignedUrl = async () => {
      try {
        let filePath = '';
        let bucket = '';

        if (imageUrl.startsWith('supabase://ticket-uploads/')) {
          filePath = imageUrl.replace('supabase://ticket-uploads/', '');
          bucket = 'ticket-uploads';
        } else if (imageUrl.startsWith('supabase://payment-proofs/')) {
          filePath = imageUrl.replace('supabase://payment-proofs/', '');
          bucket = 'payment-proofs';
        } else if (imageUrl.startsWith('supabase://order-uploads/')) {
          filePath = imageUrl.replace('supabase://order-uploads/', '');
          bucket = 'order-uploads';
        } else {
          setError(true);
          setIsLoading(false);
          return;
        }

        const { data, error: signedUrlError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 3600);

        if (signedUrlError || !data) {
          console.error(
            '[InlineImage] Error creating signed URL:',
            signedUrlError
          );
          setError(true);
        } else {
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('[InlineImage] Unexpected error:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    getSignedUrl();
  }, [imageUrl]);

  useEffect(() => {
    if (modalOpen) setZoom(1);
  }, [modalOpen]);

  if (isLoading) {
    return (
      <div className="inline-block my-2 w-32 h-32 bg-neutral-200 animate-pulse rounded-lg" />
    );
  }

  if (error || !signedUrl) {
    return null; // Don't show anything if image fails to load
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className="block my-2 max-w-xs rounded-lg overflow-hidden border border-neutral-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => setModalOpen(true)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setModalOpen(true);
          }
        }}
        aria-label="View image"
      >
        <img
          src={signedUrl}
          alt="Inline attachment"
          className="w-full h-auto object-contain pointer-events-none"
          style={{ maxHeight: '180px' }}
          draggable="false"
        />
      </div>

      {/* Image Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          size="xl"
          closeOnOverlayClick={true}
          closeOnEscape={true}
        >
          <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
            <Modal.Header
              showCloseButton={true}
              onClose={() => setModalOpen(false)}
            >
              <Container
                size="full"
                className="flex items-center justify-end gap-2"
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm border border-neutral-200 rounded hover:bg-neutral-50"
                  onClick={() => setZoom(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                  <Text as="span" size="sm">
                    Zoom out
                  </Text>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm border border-neutral-200 rounded hover:bg-neutral-50"
                  onClick={() => setZoom(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                  <Text as="span" size="sm">
                    Zoom in
                  </Text>
                </button>
              </Container>
            </Modal.Header>
            <Modal.Body>
              <div className="bg-neutral-50 p-0 min-h-[200px] max-h-[80vh] max-w-[90vw] overflow-auto">
                <div className="p-4 inline-block">
                  <img
                    ref={imgRef}
                    src={signedUrl}
                    alt="Attachment"
                    className="block rounded-lg select-none"
                    style={{
                      maxWidth: 'none',
                      width: `${zoom * 100}%`,
                      height: 'auto',
                    }}
                    draggable="false"
                  />
                </div>
              </div>
            </Modal.Body>
          </div>
        </Modal>
      )}
    </>
  );
};

export interface MessageBubbleProps {
  role: 'user' | 'printy';
  text: string;
  timestamp?: string;
  imageUrls?: string[];
  preserveNewlines?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  metadata?: Record<string, any> | null;
}

/**
 * Single message bubble component
 * Displays user or bot messages with optional avatar and timestamp
 */

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  text,
  timestamp,
  imageUrls = [],
  preserveNewlines = false,
  showAvatar = true,
  showTimestamp = true,
  metadata = null,
}) => {
  const isBot = role === 'printy';
  const [processedImageUrls, setProcessedImageUrls] = useState<string[]>([]);
  const [signedTicketAttachmentUrl, setSignedTicketAttachmentUrl] = useState<
    string | null
  >(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const processedCacheRef = useRef<Map<string, string>>(new Map());
  const processingRef = useRef(false);
  const [zoom, setZoom] = useState(1);
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 5;
  const ZOOM_STEP = 0.25;

  // Check for ticket attachment in metadata
  const ticketAttachmentUrl = metadata?.attachment_url;
  const hasTicketAttachment =
    metadata?.has_attachment &&
    ticketAttachmentUrl?.startsWith('supabase://ticket-uploads/');

  // Memoize imageUrls to prevent unnecessary re-processing
  const imageUrlsKey = useMemo(() => imageUrls.join('|'), [imageUrls]);

  // Convert supabase:// URLs to signed URLs for display
  useEffect(() => {
    // Skip if already processing to avoid duplicate requests
    if (processingRef.current) return;

    const processImageUrls = async () => {
      processingRef.current = true;
      try {
        const processed = await Promise.all(
          imageUrls.map(async url => {
            // Check cache first
            if (processedCacheRef.current.has(url)) {
              return processedCacheRef.current.get(url)!;
            }

            if (url.startsWith('supabase://payment-proofs/')) {
              try {
                // Extract the file path from the supabase:// URL
                const filePath = url.replace('supabase://payment-proofs/', '');

                // Get signed URL for the private file
                const { data, error } = await supabase.storage
                  .from('payment-proofs')
                  .createSignedUrl(filePath, 3600); // 1 hour expiry

                if (error) {
                  console.error('Error creating signed URL:', error);
                  console.error('File path that failed:', filePath);
                  return url; // Fallback to original URL
                }

                // Cache the signed URL
                processedCacheRef.current.set(url, data.signedUrl);
                return data.signedUrl;
              } catch (error) {
                console.error('Error processing supabase URL:', error);
                return url; // Fallback to original URL
              }
            }

            if (url.startsWith('supabase://ticket-uploads/')) {
              try {
                // Extract the file path from the supabase:// URL
                const filePath = url.replace('supabase://ticket-uploads/', '');

                // Get signed URL for the private file
                const { data, error } = await supabase.storage
                  .from('ticket-uploads')
                  .createSignedUrl(filePath, 3600); // 1 hour expiry

                if (error) {
                  console.error(
                    'Error creating signed URL for ticket image:',
                    error
                  );
                  console.error('File path that failed:', filePath);
                  return url; // Fallback to original URL
                }

                // Cache the signed URL
                processedCacheRef.current.set(url, data.signedUrl);
                return data.signedUrl;
              } catch (error) {
                console.error('Error processing ticket upload URL:', error);
                return url; // Fallback to original URL
              }
            }
            if (url.startsWith('supabase://order-uploads/')) {
              try {
                const filePath = url.replace('supabase://order-uploads/', '');
                const { data, error } = await supabase.storage
                  .from('order-uploads')
                  .createSignedUrl(filePath, 3600); // 1 hour expiry
                if (error) {
                  console.error(
                    'Error creating signed URL for order image:',
                    error
                  );
                  console.error('File path that failed:', filePath);
                  return url; // Fallback to original URL
                }
                processedCacheRef.current.set(url, data.signedUrl);
                return data.signedUrl;
              } catch (error) {
                console.error('Error processing order upload URL:', error);
                return url; // Fallback to original URL
              }
            }
            // Cache non-supabase URLs as-is
            processedCacheRef.current.set(url, url);
            return url;
          })
        );
        setProcessedImageUrls(processed);
      } finally {
        processingRef.current = false;
      }
    };

    if (imageUrls.length > 0) {
      processImageUrls();
    } else {
      setProcessedImageUrls([]);
    }
  }, [imageUrlsKey]);

  // Process ticket-uploads URLs to signed URLs
  useEffect(() => {
    if (hasTicketAttachment && ticketAttachmentUrl) {
      const processTicketAttachment = async () => {
        try {
          const filePath = ticketAttachmentUrl.replace(
            'supabase://ticket-uploads/',
            ''
          );

          // Get signed URL for the private file
          const { data, error } = await supabase.storage
            .from('ticket-uploads')
            .createSignedUrl(filePath, 3600); // 1 hour expiry

          if (error) {
            console.error('Error creating signed URL for ticket image:', error);
            return;
          }

          setSignedTicketAttachmentUrl(data.signedUrl);
        } catch (error) {
          console.error('Error processing ticket attachment URL:', error);
        }
      };

      processTicketAttachment();
    } else {
      setSignedTicketAttachmentUrl(null);
    }
  }, [hasTicketAttachment, ticketAttachmentUrl]);

  useEffect(() => {
    if (lightboxOpen) setZoom(1);
  }, [lightboxOpen]);

  // Render text with inline images (for specific blocks like history and payment details)
  const renderTextWithInlineImages = (textContent: string) => {
    // Check if this text should render images inline
    const shouldInline =
      textContent.includes('Conversation History:') ||
      textContent.includes('NEW TICKET REQUEST') ||
      textContent.startsWith('Here are our QR codes for payment:') ||
      textContent.startsWith('Here are our bank transfer details:');

    if (!shouldInline) return textContent;

    // Image URL regex for splitting
    const imageUrlRegex =
      /(supabase:\/\/ticket-uploads\/[^\s]+|supabase:\/\/payment-proofs\/[^\s]+|supabase:\/\/order-uploads\/[^\s]+)/g;

    // Split text by image URLs
    const parts = textContent.split(imageUrlRegex);

    return parts.map((part, index) => {
      // Check if this part is an image URL
      if (
        part.startsWith('supabase://ticket-uploads/') ||
        part.startsWith('supabase://payment-proofs/') ||
        part.startsWith('supabase://order-uploads/')
      ) {
        return <InlineImage key={index} imageUrl={part} />;
      }

      // Regular text
      return part;
    });
  };

  return (
    <div className={isBot ? 'text-left' : 'text-right'}>
      <div className="flex items-start gap-2">
        {isBot && showAvatar && (
          <div className="w-6 h-6 rounded-md bg-brand-primary text-white flex items-center justify-center text-xs mt-1 sm:w-8 sm:h-8 shrink-0">
            <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        )}

        <div
          className={
            isBot
              ? 'inline-block max-w-[85%]'
              : 'inline-block max-w-[85%] ml-auto'
          }
        >
          <div
            className={
              'rounded-2xl px-3 py-2 text-sm break-words ' +
              (preserveNewlines ? 'whitespace-pre-wrap ' : '') +
              'leading-relaxed transition-all duration-200 ' +
              'sm:px-4 sm:py-3 sm:text-base ' +
              (isBot
                ? 'bg-brand-primary-50 text-neutral-700'
                : 'bg-brand-primary text-white text-left')
            }
          >
            {text && (
              <div className={preserveNewlines ? '' : 'whitespace-pre-wrap'}>
                {renderTextWithInlineImages(text)}
              </div>
            )}

            {/* Ticket image attachment as clickable link */}
            {hasTicketAttachment && signedTicketAttachmentUrl && (
              <div className="mt-3">
                <a
                  href={signedTicketAttachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-brand-primary hover:text-brand-primary-700 hover:underline transition-colors"
                  onClick={e => {
                    // Open in new tab without affecting current page
                    e.stopPropagation();
                  }}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    View attached image
                  </span>
                </a>
              </div>
            )}

            {processedImageUrls.length > 0 && (
              <div
                className={`mt-3 grid gap-3 ${
                  processedImageUrls.length === 1
                    ? 'grid-cols-1'
                    : 'grid-cols-2'
                }`}
                onClick={e => {
                  // Stop any clicks from bubbling up to parent elements
                  e.stopPropagation();
                }}
              >
                {processedImageUrls.map((src, idx) => {
                  const handleImageClick = () => {
                    setLightboxIndex(idx);
                    setLightboxOpen(true);
                  };

                  return (
                    <div
                      key={idx}
                      role="button"
                      tabIndex={0}
                      className="rounded-lg overflow-hidden border border-neutral-200 bg-white block group cursor-pointer p-0 w-full"
                      aria-label={`View image ${idx + 1}`}
                      onClick={handleImageClick}
                      onKeyDown={e => {
                        // Handle Enter/Space key for accessibility
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleImageClick();
                        }
                      }}
                      style={{
                        WebkitUserSelect: 'none',
                        userSelect: 'none',
                        outline: 'none',
                      }}
                    >
                      <img
                        src={src}
                        alt={`Payment proof ${idx + 1}`}
                        className="w-full h-auto object-contain transition-transform duration-200 group-hover:scale-[1.02] pointer-events-none"
                        style={{ maxHeight: 180 }}
                        draggable="false"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {showTimestamp && timestamp && (
            <div
              className={`text-xs text-neutral-500 mt-1 ${isBot ? 'text-right' : 'text-left'}`}
            >
              {timestamp}
            </div>
          )}
        </div>

        {!isBot && showAvatar && (
          <div className="w-6 h-6 rounded-md bg-neutral-600 text-white flex items-center justify-center text-xs mt-1 sm:w-8 sm:h-8 shrink-0">
            <User className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        )}
      </div>

      {/* Image Lightbox Modal */}
      {lightboxOpen && processedImageUrls.length > 0 && (
        <Modal
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          size="xl"
          closeOnOverlayClick={true}
          closeOnEscape={true}
        >
          <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
            <Modal.Header
              showCloseButton={true}
              onClose={() => setLightboxOpen(false)}
            >
              <Container
                size="full"
                className="flex items-center justify-end gap-2"
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm border border-neutral-200 rounded hover:bg-neutral-50"
                  onClick={() => setZoom(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="w-4 h-4" />
                  <Text as="span" size="sm">
                    Zoom out
                  </Text>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm border border-neutral-200 rounded hover:bg-neutral-50"
                  onClick={() => setZoom(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="w-4 h-4" />
                  <Text as="span" size="sm">
                    Zoom in
                  </Text>
                </button>
              </Container>
            </Modal.Header>
            <Modal.Body>
              <div className="bg-neutral-50 p-0 min-h-[200px] max-h-[80vh] max-w-[90vw] overflow-auto">
                <div className="p-4 inline-block">
                  <img
                    src={processedImageUrls[lightboxIndex]}
                    alt={`Payment proof ${lightboxIndex + 1}`}
                    className="block rounded-lg select-none"
                    style={{
                      maxWidth: 'none',
                      width: `${zoom * 100}%`,
                      height: 'auto',
                    }}
                    draggable="false"
                  />
                </div>
              </div>
            </Modal.Body>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MessageBubble;
