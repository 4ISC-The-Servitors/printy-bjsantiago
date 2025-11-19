import React from 'react';
import { Text } from '@shared/components';
import type { AboutSection } from '@admin/services/aboutCompanyService';
import { formatDateWithTimeDesktop } from '@shared/utils/dateFormatter';

interface AboutSectionItemProps {
  section: AboutSection;
}

export const AboutSectionItem: React.FC<AboutSectionItemProps> = ({ section }) => {
  const updatedDate = formatDateWithTimeDesktop(section.updated_at);

  return (
    <article className="border border-gray-200 rounded-lg p-4 sm:p-5 bg-white shadow-sm space-y-3">
      <Text variant="h4" size="lg" weight="semibold" className="text-gray-900">
        {section.about_name}
      </Text>
      <Text
        variant="p"
        size="sm"
        className="text-gray-700 whitespace-pre-line leading-relaxed"
      >
        {section.description}
      </Text>
      <Text variant="p" size="xs" color="muted" className="pt-1">
        Updated {updatedDate}
      </Text>
    </article>
  );
};

export default AboutSectionItem;

