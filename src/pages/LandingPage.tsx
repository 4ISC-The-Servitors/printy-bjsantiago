import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Text } from '../components/shared';
import { ChevronDown, MessageCircle, Printer, Users, Award, Clock } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const scrollToChat = () => {
    document.getElementById('chat-section')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <Container className="py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <div>
                <Text variant="h3" size="lg" weight="bold" className="text-brand-primary">
                  Printy
                </Text>
                <Text variant="p" size="xs" color="muted">
                  B.J. Santiago Inc.
                </Text>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" threeD onClick={() => navigate('/auth/signin')}>
                Sign In
              </Button>
              <Button variant="primary" size="sm" threeD onClick={() => navigate('/auth/signup')}>
                Sign Up
              </Button>
            </div>
          </div>
        </Container>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <Container>
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <div className="space-y-6">
              <Text variant="h1" size="6xl" weight="bold" className="text-brand-primary leading-tight text-center">
                Introducing Printy
              </Text>
              <Text variant="p" size="xl" color="muted" className="leading-relaxed max-w-3xl mx-auto text-center">
                For over 33 years, B.J. Santiago Inc. has delivered trusted printing solutions to businesses across the Philippines. Now, with Printy, our prompt-based chatbot assistant, we're making it easier than ever to browse services, place orders, track print jobs, and get instant support — all in one chat.
              </Text>
            </div>

            <div className="space-y-4 text-center">
              <Button 
                variant="primary" 
                size="lg" 
                threeD
                onClick={scrollToChat}
                className="group"
              >
                Try out Printy
                <ChevronDown className="w-5 h-5 ml-2 group-hover:translate-y-1 transition-transform" />
              </Button>
              <Text variant="p" size="lg" color="muted" className="text-center">
                Experience our new chatbot assistant today
              </Text>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-brand-primary-100 rounded-full flex items-center justify-center mx-auto">
                <Printer className="w-8 h-8 text-brand-primary" />
              </div>
              <Text variant="h3" size="xl" weight="semibold" className="text-center">
                Professional Printing
              </Text>
              <Text variant="p" color="muted">
                Offset, digital, and large format printing with 33+ years of expertise
              </Text>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-brand-accent-100 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="w-8 h-8 text-brand-accent" />
              </div>
              <Text variant="h3" size="xl" weight="semibold" className="text-center">
                Prompt-Based Support
              </Text>
              <Text variant="p" color="muted">
                Instant assistance through our prompt-based chatbot system
              </Text>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto">
                <Award className="w-8 h-8 text-success" />
              </div>
              <Text variant="h3" size="xl" weight="semibold" className="text-center">
                Trusted Quality
              </Text>
              <Text variant="p" color="muted">
                Consistent excellence and reliable service delivery
              </Text>
            </div>
          </div>
        </Container>
      </section>

      {/* Chat Section */}
      <section id="chat-section" className="py-20 bg-gradient-to-br from-brand-primary-50 to-white">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-8 mb-12">
              <Text variant="h2" size="4xl" weight="bold" className="text-brand-primary text-center">
                Hi there! I'm Printy, your chatbot assistant!
              </Text>
              <Text variant="p" size="lg" color="muted" className="text-center">
                Choose a topic and chat right here.
              </Text>
            </div>

            {/* Action Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ActionCard
                title="About Us"
                description="Learn about our company history and values"
                icon={<Users className="w-6 h-6" />}
                onClick={() => console.log('About Us clicked')}
              />
              
              <ActionCard
                title="FAQs"
                description="Find answers to common questions"
                icon={<MessageCircle className="w-6 h-6" />}
                onClick={() => console.log('FAQs clicked')}
              />
              
              <ActionCard
                title="Place an Order"
                description="Start your printing project"
                icon={<Printer className="w-6 h-6" />}
                onClick={() => console.log('Place Order clicked')}
              />
              
              <ActionCard
                title="Track a Ticket"
                description="Monitor your order progress"
                icon={<Clock className="w-6 h-6" />}
                onClick={() => console.log('Track Ticket clicked')}
              />
              
              <ActionCard
                title="Services Offered"
                description="Explore our printing solutions"
                icon={<Award className="w-6 h-6" />}
                onClick={() => console.log('Services clicked')}
              />
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-neutral-900 text-white">
        <Container>
          <div className="text-center space-y-4">
            <Text variant="h3" size="lg" weight="semibold">
              B.J. Santiago Inc.
            </Text>
            <Text variant="p" color="muted">
              Trusted printing solutions since 1992
            </Text>
            <Text variant="p" size="sm" color="muted">
              © 2024 Printy. All rights reserved.
            </Text>
          </div>
        </Container>
      </footer>
    </div>
  );
};

// Action Card Component
interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, description, icon, onClick }) => (
  <div
    onClick={onClick}
    className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-neutral-200 hover:border-brand-primary/20 hover:-translate-y-1"
  >
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-brand-primary-100 rounded-lg flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <Text variant="h4" size="lg" weight="semibold" className="group-hover:text-brand-primary transition-colors">
          {title}
        </Text>
        <Text variant="p" size="sm" color="muted" className="mt-1">
          {description}
        </Text>
      </div>
    </div>
  </div>
);

export default LandingPage;
