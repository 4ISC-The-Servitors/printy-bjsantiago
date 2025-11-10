import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Bot,
  User,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  FileText,
  Download,
} from 'lucide-react';
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
  pdfUrls?: string[];
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
  pdfUrls = [],
  preserveNewlines = false,
  showAvatar = true,
  showTimestamp = true,
  metadata = null,
}) => {
  const isBot = role === 'printy';
  const [processedImageUrls, setProcessedImageUrls] = useState<
    Array<{ url: string; signedUrl: string | null; filename: string }>
  >([]);
  const [processedPdfUrls, setProcessedPdfUrls] = useState<
    Array<{ url: string; signedUrl: string | null; filename: string }>
  >([]);
  const [signedTicketAttachmentUrl, setSignedTicketAttachmentUrl] = useState<
    string | null
  >(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalIndex, setImageModalIndex] = useState(0);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfModalIndex, setPdfModalIndex] = useState(0);
  const imageCacheRef = useRef<
    Map<string, { signedUrl: string; filename: string }>
  >(new Map());
  const pdfCacheRef = useRef<
    Map<string, { signedUrl: string; filename: string }>
  >(new Map());
  const imageProcessingRef = useRef(false);
  const pdfProcessingRef = useRef(false);
  const [zoom, setZoom] = useState(1);
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 5;
  const ZOOM_STEP = 0.25;

  // Check for ticket attachment in metadata
  const ticketAttachmentUrl = metadata?.attachment_url;
  const hasTicketAttachment =
    metadata?.has_attachment &&
    ticketAttachmentUrl?.startsWith('supabase://ticket-uploads/');

  // Extract filename from URL path
  const extractFilename = useMemo(
    () =>
      (url: string): string => {
        try {
          // For HTTP/HTTPS URLs, try to extract from path
          if (url.startsWith('http://') || url.startsWith('https://')) {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const parts = pathname.split('/');
            const lastPart = parts[parts.length - 1] || '';
            // Remove query parameters if present
            const filename = lastPart.split('?')[0];
            // If we got a valid filename, return it; otherwise use a default
            if (filename && filename.includes('.')) {
              return filename;
            }
            // Fallback: use a descriptive name based on URL
            if (url.includes('payment-methods')) {
              return url.includes('bank_transfer')
                ? 'bank-transfer.jpg'
                : 'qr-code.jpg';
            }
            return 'image.jpg';
          }

          // For supabase:// URLs
          const parts = url.split('/');
          const lastPart = parts[parts.length - 1] || '';

          // Return the filename as-is (no timestamp prefix)
          // Handles "filename.ext" and "filename_01.ext" formats
          return lastPart || 'image.jpg';
        } catch (error) {
          // Fallback if URL parsing fails
          const parts = url.split('/');
          return parts[parts.length - 1] || 'image.jpg';
        }
      },
    []
  );

  // Memoize imageUrls and pdfUrls to prevent unnecessary re-processing
  const imageUrlsKey = useMemo(() => imageUrls.join('|'), [imageUrls]);
  const pdfUrlsKey = useMemo(() => pdfUrls.join('|'), [pdfUrls]);

  // Process image URLs to signed URLs (same as PDFs)
  useEffect(() => {
    if (imageProcessingRef.current) return;

    const processImageUrls = async () => {
      imageProcessingRef.current = true;
      try {
        const processed = await Promise.all(
          imageUrls.map(async url => {
            // Check cache first
            if (imageCacheRef.current.has(url)) {
              const cached = imageCacheRef.current.get(url)!;
              return {
                url,
                signedUrl: cached.signedUrl,
                filename: cached.filename,
              };
            }

            // Handle different URL types
            // 1. Private supabase:// URLs need signed URLs
            // 2. Public HTTPS URLs (payment methods) can be used directly
            if (url.startsWith('http://') || url.startsWith('https://')) {
              // Public URL - use directly, no need for signed URL
              const filename = extractFilename(url);
              imageCacheRef.current.set(url, {
                signedUrl: url,
                filename,
              });
              return { url, signedUrl: url, filename };
            }

            // Handle private supabase:// URLs
            let filePath = '';
            let bucket = '';

            if (url.startsWith('supabase://payment-proofs/')) {
              filePath = url.replace('supabase://payment-proofs/', '');
              bucket = 'payment-proofs';
            } else if (url.startsWith('supabase://ticket-uploads/')) {
              filePath = url.replace('supabase://ticket-uploads/', '');
              bucket = 'ticket-uploads';
            } else if (url.startsWith('supabase://order-uploads/')) {
              filePath = url.replace('supabase://order-uploads/', '');
              bucket = 'order-uploads';
            } else {
              // Unknown URL format - try to extract filename and return as-is
              const filename = extractFilename(url);
              return {
                url,
                signedUrl: null,
                filename,
              };
            }

            try {
              const { data, error } = await supabase.storage
                .from(bucket)
                .createSignedUrl(filePath, 3600); // 1 hour expiry

              const filename = extractFilename(url);

              if (error) {
                console.error('Error creating signed URL for image:', error);
                imageCacheRef.current.set(url, { signedUrl: '', filename });
                return { url, signedUrl: null, filename };
              }

              imageCacheRef.current.set(url, {
                signedUrl: data.signedUrl,
                filename,
              });
              return { url, signedUrl: data.signedUrl, filename };
            } catch (error) {
              console.error('Error processing image URL:', error);
              const filename = extractFilename(url);
              return { url, signedUrl: null, filename };
            }
          })
        );
        setProcessedImageUrls(processed);
      } finally {
        imageProcessingRef.current = false;
      }
    };

    if (imageUrls.length > 0) {
      processImageUrls();
    } else {
      setProcessedImageUrls([]);
    }
  }, [imageUrlsKey, imageUrls, extractFilename]);

  // Process PDF URLs to signed URLs
  useEffect(() => {
    if (pdfProcessingRef.current) return;

    const processPdfUrls = async () => {
      pdfProcessingRef.current = true;
      try {
        const processed = await Promise.all(
          pdfUrls.map(async url => {
            // Check cache first
            if (pdfCacheRef.current.has(url)) {
              const cached = pdfCacheRef.current.get(url)!;
              return {
                url,
                signedUrl: cached.signedUrl,
                filename: cached.filename,
              };
            }

            let filePath = '';
            let bucket = '';

            if (url.startsWith('supabase://payment-proofs/')) {
              filePath = url.replace('supabase://payment-proofs/', '');
              bucket = 'payment-proofs';
            } else if (url.startsWith('supabase://ticket-uploads/')) {
              filePath = url.replace('supabase://ticket-uploads/', '');
              bucket = 'ticket-uploads';
            } else if (url.startsWith('supabase://order-uploads/')) {
              filePath = url.replace('supabase://order-uploads/', '');
              bucket = 'order-uploads';
            } else {
              return {
                url,
                signedUrl: null,
                filename: extractFilename(url),
              };
            }

            try {
              const { data, error } = await supabase.storage
                .from(bucket)
                .createSignedUrl(filePath, 3600); // 1 hour expiry

              const filename = extractFilename(url);

              if (error) {
                console.error('Error creating signed URL for PDF:', error);
                pdfCacheRef.current.set(url, { signedUrl: '', filename });
                return { url, signedUrl: null, filename };
              }

              pdfCacheRef.current.set(url, {
                signedUrl: data.signedUrl,
                filename,
              });
              return { url, signedUrl: data.signedUrl, filename };
            } catch (error) {
              console.error('Error processing PDF URL:', error);
              const filename = extractFilename(url);
              return { url, signedUrl: null, filename };
            }
          })
        );
        setProcessedPdfUrls(processed);
      } finally {
        pdfProcessingRef.current = false;
      }
    };

    if (pdfUrls.length > 0) {
      processPdfUrls();
    } else {
      setProcessedPdfUrls([]);
    }
  }, [pdfUrlsKey, pdfUrls, extractFilename]);

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
    if (imageModalOpen) setZoom(1);
  }, [imageModalOpen]);

  useEffect(() => {
    if (pdfModalOpen) setZoom(1);
  }, [pdfModalOpen]);

  // Render text with inline images (only for conversation history blocks)
  // QR codes and payment proofs now render as filename buttons for consistent UI
  const renderTextWithInlineImages = (textContent: string) => {
    // Only render images inline for conversation history blocks
    // All other images (QR codes, payment proofs) are rendered as filename buttons
    const shouldInline =
      textContent.includes('Conversation History:') ||
      textContent.includes('NEW TICKET REQUEST');

    if (!shouldInline) return textContent;

    // Image URL regex for splitting
    const imageUrlRegex =
      /(supabase:\/\/ticket-uploads\/[^\s]+|supabase:\/\/payment-proofs\/[^\s]+|supabase:\/\/order-uploads\/[^\s]+)/g;

    // Split text by image URLs
    const parts = textContent.split(imageUrlRegex);

    return parts.map((part, index) => {
      // Check if this part is an image URL (exclude PDFs)
      if (
        (part.startsWith('supabase://ticket-uploads/') ||
          part.startsWith('supabase://payment-proofs/') ||
          part.startsWith('supabase://order-uploads/')) &&
        !part.toLowerCase().includes('.pdf')
      ) {
        return <InlineImage key={index} imageUrl={part} />;
      }

      // Regular text or PDF (PDFs are handled separately in the main render)
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

            {/* Image Files - Display as filenames (same as PDFs) */}
            {processedImageUrls.length > 0 && (
              <div
                className="mt-3 space-y-2"
                onClick={e => {
                  e.stopPropagation();
                }}
              >
                {processedImageUrls.map((image, idx) => {
                  const handleImageClick = () => {
                    if (image.signedUrl) {
                      setImageModalIndex(idx);
                      setImageModalOpen(true);
                    }
                  };

                  return (
                    <div
                      key={idx}
                      role="button"
                      tabIndex={0}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer transition-colors"
                      aria-label={`View image ${image.filename}`}
                      onClick={handleImageClick}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleImageClick();
                        }
                      }}
                    >
                      <ImageIcon className="w-4 h-4 text-brand-primary shrink-0" />
                      <span className="text-sm font-medium text-neutral-700 truncate max-w-xs">
                        {image.filename}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PDF Files - Display as filenames */}
            {processedPdfUrls.length > 0 && (
              <div
                className="mt-3 space-y-2"
                onClick={e => {
                  e.stopPropagation();
                }}
              >
                {processedPdfUrls.map((pdf, idx) => {
                  const handlePdfClick = () => {
                    if (pdf.signedUrl) {
                      setPdfModalIndex(idx);
                      setPdfModalOpen(true);
                    }
                  };

                  return (
                    <div
                      key={idx}
                      role="button"
                      tabIndex={0}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 cursor-pointer transition-colors"
                      aria-label={`View PDF ${pdf.filename}`}
                      onClick={handlePdfClick}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePdfClick();
                        }
                      }}
                    >
                      <FileText className="w-4 h-4 text-brand-primary shrink-0" />
                      <span className="text-sm font-medium text-neutral-700 truncate max-w-xs">
                        {pdf.filename}
                      </span>
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

      {/* Image Preview Modal */}
      {imageModalOpen &&
        processedImageUrls.length > 0 &&
        processedImageUrls[imageModalIndex]?.signedUrl && (
          <Modal
            isOpen={imageModalOpen}
            onClose={() => setImageModalOpen(false)}
            size="xl"
            closeOnOverlayClick={true}
            closeOnEscape={true}
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
              <Modal.Header
                showCloseButton={true}
                onClose={() => setImageModalOpen(false)}
              >
                <Container
                  size="full"
                  className="flex items-center justify-between gap-2"
                >
                  <Text
                    as="h3"
                    size="lg"
                    className="font-semibold truncate flex-1"
                  >
                    {processedImageUrls[imageModalIndex].filename}
                  </Text>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
                      aria-label="Download image"
                      onClick={async e => {
                        e.stopPropagation();
                        const imageUrl =
                          processedImageUrls[imageModalIndex].signedUrl;
                        const filename =
                          processedImageUrls[imageModalIndex].filename;

                        if (!imageUrl) return;

                        try {
                          // Fetch the image as a blob
                          const response = await fetch(imageUrl);
                          const blob = await response.blob();

                          // Create an object URL from the blob
                          const blobUrl = URL.createObjectURL(blob);

                          // Create a temporary anchor element
                          const link = document.createElement('a');
                          link.href = blobUrl;
                          link.download = filename;
                          link.style.display = 'none';

                          // Append to body, click, and remove
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);

                          // Clean up the object URL after a delay
                          setTimeout(() => {
                            URL.revokeObjectURL(blobUrl);
                          }, 100);
                        } catch (error) {
                          console.error('Error downloading image:', error);
                        }
                      }}
                    >
                      <Download className="w-4 h-4" />
                      <Text as="span" size="sm">
                        Download
                      </Text>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm border border-neutral-200 rounded hover:bg-neutral-50"
                      onClick={() =>
                        setZoom(Math.max(MIN_ZOOM, zoom - ZOOM_STEP))
                      }
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
                      onClick={() =>
                        setZoom(Math.min(MAX_ZOOM, zoom + ZOOM_STEP))
                      }
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="w-4 h-4" />
                      <Text as="span" size="sm">
                        Zoom in
                      </Text>
                    </button>
                  </div>
                </Container>
              </Modal.Header>
              <Modal.Body>
                <div className="bg-neutral-50 p-0 min-h-[200px] max-h-[80vh] max-w-[90vw] overflow-auto">
                  <div className="p-4 inline-block">
                    <img
                      src={
                        processedImageUrls[imageModalIndex].signedUrl ||
                        undefined
                      }
                      alt={processedImageUrls[imageModalIndex].filename}
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

      {/* PDF Preview Modal */}
      {pdfModalOpen &&
        processedPdfUrls.length > 0 &&
        processedPdfUrls[pdfModalIndex]?.signedUrl && (
          <Modal
            isOpen={pdfModalOpen}
            onClose={() => setPdfModalOpen(false)}
            size="xl"
            closeOnOverlayClick={true}
            closeOnEscape={true}
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
              <Modal.Header
                showCloseButton={true}
                onClose={() => setPdfModalOpen(false)}
              >
                <Container
                  size="full"
                  className="flex items-center justify-between gap-2"
                >
                  <Text
                    as="h3"
                    size="lg"
                    className="font-semibold truncate flex-1"
                  >
                    {processedPdfUrls[pdfModalIndex].filename}
                  </Text>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm border border-neutral-200 rounded hover:bg-neutral-50 transition-colors"
                      aria-label="Download PDF"
                      onClick={async e => {
                        e.stopPropagation();
                        const pdfUrl =
                          processedPdfUrls[pdfModalIndex].signedUrl;
                        const filename =
                          processedPdfUrls[pdfModalIndex].filename;

                        if (!pdfUrl) return;

                        try {
                          // Fetch the PDF as a blob
                          const response = await fetch(pdfUrl);
                          const blob = await response.blob();

                          // Create an object URL from the blob
                          const blobUrl = URL.createObjectURL(blob);

                          // Create a temporary anchor element
                          const link = document.createElement('a');
                          link.href = blobUrl;
                          link.download = filename;
                          link.style.display = 'none';

                          // Append to body, click, and remove
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);

                          // Clean up the object URL after a delay
                          setTimeout(() => {
                            URL.revokeObjectURL(blobUrl);
                          }, 100);
                        } catch (error) {
                          console.error('Error downloading PDF:', error);
                        }
                      }}
                    >
                      <Download className="w-4 h-4" />
                      <Text as="span" size="sm">
                        Download
                      </Text>
                    </button>
                  </div>
                </Container>
              </Modal.Header>
              <Modal.Body>
                <div className="bg-neutral-50 p-0 min-h-[200px] max-h-[80vh] max-w-[90vw] overflow-auto">
                  {processedPdfUrls[pdfModalIndex]?.signedUrl && (
                    <iframe
                      src={
                        processedPdfUrls[pdfModalIndex].signedUrl || undefined
                      }
                      className="w-full h-full min-h-[600px] border-0"
                      title={processedPdfUrls[pdfModalIndex].filename}
                    />
                  )}
                </div>
              </Modal.Body>
            </div>
          </Modal>
        )}
    </div>
  );
};

export default MessageBubble;
