import React from 'react';
import { Text } from '@shared/components';
import type { CompanyFaq } from '@admin/services/companyFaqService';
import { formatDateWithTimeDesktop } from '@shared/utils/dateFormatter';

interface FaqItemProps {
  faq: CompanyFaq;
}

export const FaqItem: React.FC<FaqItemProps> = ({ faq }) => {
  const updatedDate = formatDateWithTimeDesktop(faq.updated_at);

  return (
    <article className="border border-gray-200 rounded-lg p-4 sm:p-5 bg-white shadow-sm space-y-3">
      <Text variant="h4" size="lg" weight="semibold" className="text-gray-900">
        {faq.question}
      </Text>
      <Text
        variant="p"
        size="sm"
        className="text-gray-700 whitespace-pre-line leading-relaxed"
      >
        {faq.answer}
      </Text>
      <Text variant="p" size="xs" color="muted" className="pt-1">
        Updated {updatedDate}
      </Text>
    </article>
  );
};

export default FaqItem;

