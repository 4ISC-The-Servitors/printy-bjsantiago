import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bot, User } from 'lucide-react';
import { supabase } from '@lib/supabase';
import Modal from '@shared/components/ui/Modal';

export interface MessageBubbleProps {
  role: 'user' | 'printy';
  text: string;
  timestamp?: string;
  imageUrls?: string[];
  preserveNewlines?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
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
}) => {
  const isBot = role === 'printy';
  const [processedImageUrls, setProcessedImageUrls] = useState<string[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const processedCacheRef = useRef<Map<string, string>>(new Map());
  const processingRef = useRef(false);

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
                {text}
              </div>
            )}

            {processedImageUrls.length > 0 && (
              <div 
                className="mt-3 grid grid-cols-2 gap-3"
                onClick={(e) => {
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
                      onKeyDown={(e) => {
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
                        outline: 'none'
                      }}
                    >
                      <img
                        src={src}
                        alt={`Payment proof ${idx + 1}`}
                        className="w-full h-auto object-contain transition-transform duration-200 group-hover:scale-[1.02] pointer-events-none"
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
              <div className="sr-only">Image Viewer</div>
            </Modal.Header>
            <Modal.Body>
              <div className="flex items-center justify-center bg-neutral-50 p-4 min-h-[200px]">
                <img
                  src={processedImageUrls[lightboxIndex]}
                  alt={`Payment proof ${lightboxIndex + 1}`}
                  className="max-w-full max-h-[70vh] w-auto h-auto object-contain rounded-lg"
                  draggable="false"
                />
              </div>
            </Modal.Body>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MessageBubble;
