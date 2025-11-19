import React, { useEffect, useState } from 'react';
import { Card, Badge, Text, Button } from '@shared/components';
import { ChevronDown, MessageSquare } from 'lucide-react';
import { AboutCompanyService } from '@admin/services/aboutCompanyService';
import { CompanyFaqService } from '@admin/services/companyFaqService';
import type { AboutSection } from '@admin/services/aboutCompanyService';
import type { CompanyFaq } from '@admin/services/companyFaqService';
import { AboutSectionItem } from './AboutSectionItem';
import { FaqItem } from './FaqItem';

interface StaticInfoSectionsCardProps {
  onViewInChat: (serviceId: string) => void;
}

export const StaticInfoSectionsCard: React.FC<StaticInfoSectionsCardProps> = ({
  onViewInChat,
}) => {
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const [aboutSections, setAboutSections] = useState<AboutSection[]>([]);
  const [aboutError, setAboutError] = useState<string | null>(null);
  const [isLoadingAbout, setIsLoadingAbout] = useState<boolean>(true);
  const [faqItems, setFaqItems] = useState<CompanyFaq[]>([]);
  const [faqError, setFaqError] = useState<string | null>(null);
  const [isLoadingFaq, setIsLoadingFaq] = useState<boolean>(true);

  const toggleSection = (sectionId: string) => {
    setOpenSectionId(prev => (prev === sectionId ? null : sectionId));
  };

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      setIsLoadingAbout(true);
      setIsLoadingFaq(true);

      const [aboutResult, faqResult] = await Promise.allSettled([
        AboutCompanyService.listSections(),
        CompanyFaqService.listFaqs(),
      ]);

      if (!isMounted) {
        return;
      }

      if (aboutResult.status === 'fulfilled') {
        setAboutSections(aboutResult.value);
        setAboutError(null);
      } else {
        console.error('Failed to load about sections:', aboutResult.reason);
        setAboutSections([]);
        setAboutError('Unable to load About B.J. Santiago content right now.');
      }

      if (faqResult.status === 'fulfilled') {
        setFaqItems(faqResult.value);
        setFaqError(null);
      } else {
        console.error('Failed to load FAQs:', faqResult.reason);
        setFaqItems([]);
        setFaqError('Unable to load FAQs right now.');
      }

      setIsLoadingAbout(false);
      setIsLoadingFaq(false);
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, []);

  const sectionsConfig = [
    {
      id: 'about-bj-santiago',
      title: 'About B.J. Santiago',
      ariaLabel: 'About B.J. Santiago section',
      type: 'about' as const,
      items: aboutSections,
      isLoading: isLoadingAbout,
      error: aboutError,
      emptyState: 'No About content found. Add a section to get started.',
      chatTriggerId: 'about-bj-santiago',
    },
    {
      id: 'faqs-bj-santiago',
      title: 'FAQs',
      ariaLabel: 'FAQs section',
      type: 'faq' as const,
      items: faqItems,
      isLoading: isLoadingFaq,
      error: faqError,
      emptyState: 'No FAQs configured yet.',
      chatTriggerId: 'faqs-bj-santiago',
    },
  ];

  return (
    <>
      {sectionsConfig.map(section => {
        const isOpen = openSectionId === section.id;
        return (
          <Card className="p-0" key={section.id}>
            <div className="flex items-center justify-between px-3 py-2 sm:px-4 gap-2">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
                className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-md flex-1"
              >
                <Text variant="h3" size="lg" weight="semibold" className="flex items-center gap-3">
                  {section.title}
                  <Badge size="sm" variant="secondary">
                  {section.items.length}
                  </Badge>
                </Text>
              </button>
              <div className="flex items-center gap-2">
                {section.chatTriggerId && isOpen && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    threeD
                    className="min-h-[44px] min-w-[44px] touch-target flex-shrink-0"
                    title={`Chat about ${section.title}`}
                    onClick={() => onViewInChat(section.chatTriggerId as string)}
                  >
                    <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${section.ariaLabel}`}
                  className="min-h-[44px] min-w-[44px] touch-target rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center justify-center flex-shrink-0"
                >
                  <ChevronDown
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
            {isOpen && (
              <div className="p-8 space-y-6">
                {section.isLoading && (
                  <Text variant="p" size="sm" color="muted">
                    Loading {section.title}...
                  </Text>
                )}
                {!section.isLoading && section.error && (
                  <Text variant="p" size="sm" color="error">
                    {section.error}
                  </Text>
                )}
                {!section.isLoading && !section.error && section.items.length === 0 && (
                  <Text variant="p" size="sm" color="muted">
                    {section.emptyState}
                  </Text>
                )}
                {!section.isLoading && !section.error && section.items.length > 0 && (
                  <div className="grid grid-cols-1 gap-4">
                    {section.type === 'about'
                      ? section.items.map(item => (
                          <AboutSectionItem key={item.about_id} section={item} />
                        ))
                      : section.items.map(item => <FaqItem key={item.faq_id} faq={item} />)}
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </>
  );
};

export default StaticInfoSectionsCard;

