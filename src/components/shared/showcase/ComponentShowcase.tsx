import React from 'react';
import { Container, Text } from '../index';
import {
  ButtonShowcase,
  InputShowcase,
  CardShowcase,
  TypographyShowcase,
  BadgeShowcase,
  SkeletonShowcase,
  ContainerShowcase,
  ToastShowcase,
  ModalShowcase,
} from './index';

const ComponentShowcase: React.FC = () => {
  return (
    <Container className="py-8 space-y-8">
      <ShowcaseHeader />
      <ButtonShowcase />
      <InputShowcase />
      <CardShowcase />
      <TypographyShowcase />
      <BadgeShowcase />
      <SkeletonShowcase />
      <ContainerShowcase />
      <ToastShowcase />
      <ModalShowcase />
    </Container>
  );
};

const ShowcaseHeader: React.FC = () => (
  <div className="text-center">
    <Text variant="h1" size="4xl" weight="bold" className="text-brand-primary">
      Printy Design System
    </Text>
    <Text variant="p" size="lg" color="muted" className="mt-4">
      Shared UI Components following our design principles
    </Text>
  </div>
);

export default ComponentShowcase;
