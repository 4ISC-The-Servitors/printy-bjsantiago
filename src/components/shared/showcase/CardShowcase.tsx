import React from 'react';
import { Card, Button } from '../index';
import { Text } from '../index';

const CardShowcase: React.FC = () => {
  return (
    <section className="space-y-6">
      <Text variant="h2" size="2xl" weight="semibold">
        Cards
      </Text>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Simple Card" subtitle="A basic card example">
          <Text>This is a simple card with title and subtitle.</Text>
        </Card>
        
        <Card hoverable>
          <Card.Header>
            <Card.Title>Compound Card</Card.Title>
            <Card.Actions>
              <Button variant="ghost" size="sm">Edit</Button>
            </Card.Actions>
          </Card.Header>
          <Card.Content>
            <Text>This card uses the compound component pattern.</Text>
          </Card.Content>
          <Card.Footer>
            <Button variant="primary" size="sm">Save</Button>
          </Card.Footer>
        </Card>

        <Card title="Clickable Card" hoverable onClick={() => alert('Card clicked!')}>
          <Text>This card is clickable and has hover effects.</Text>
        </Card>
      </div>
    </section>
  );
};

export default CardShowcase;
