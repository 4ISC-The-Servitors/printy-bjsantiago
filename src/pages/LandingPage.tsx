import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Text } from '../components/shared';
import { MessageCircle, Printer, Users, Award } from 'lucide-react';
import GuestChatPanel from '../components/chat/GuestChatPanel';
import {
  type ChatMessage,
  type QuickReply,
  type ChatRole,
} from '../components/chat/types';
import { guestFlows as flows } from '../chatLogic/guest';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = React.useState(false);
  const [quickReplies, setQuickReplies] = React.useState<QuickReply[]>([]);
  const [currentFlow, setCurrentFlow] = React.useState<any>(null);
  const [chatTitle, setChatTitle] = React.useState<string>('Chat');
  const [inputPlaceholder, setInputPlaceholder] =
    React.useState('Type a message...');
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const scrollToChat = () => {
    document.getElementById('chat-section')?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  const initializeFlow = (flowKey: 'about' | 'faqs' | 'place-order') => {
    const flow = flows[flowKey];
    if (!flow) return;
    setCurrentFlow(flow);
    setChatTitle(flow.title);
    setIsChatOpen(true);
    setIsTyping(true);
    setMessages([]);
    setQuickReplies([]);
    setTimeout(() => {
      const initialMessages = flow.initial({});
      const botMessages: ChatMessage[] = initialMessages.map((msg: any) => ({
        id: crypto.randomUUID(),
        role: 'printy' as ChatRole,
        text: msg.text,
        ts: Date.now(),
      }));
      setMessages(botMessages);
      const replies = flow
        .quickReplies()
        .map((label: string) => ({ label, value: label }));
      setQuickReplies(replies);
      setInputPlaceholder('Type a message...');
      setIsTyping(false);
    }, 1500);
    document
      .getElementById('chat-section')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (text: string) => {
    if (!currentFlow) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      ts: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setQuickReplies([]);

    try {
      const response = await currentFlow.respond({}, text);
      setTimeout(() => {
        const newBotMessages: ChatMessage[] = response.messages.map(
          (m: any) => ({
            id: crypto.randomUUID(),
            role: 'printy',
            text: m.text,
            ts: Date.now(),
          })
        );
        setMessages(prev => [...prev, ...newBotMessages]);
        const replies = (response.quickReplies ?? []).map((label: string) => ({
          label,
          value: label,
        }));
        setQuickReplies(replies);
        setInputPlaceholder('Type a message...');
        setIsTyping(false);

        // If guest is in place-order flow, redirect on auth choices
        const normalized = text.trim().toLowerCase();
        if (currentFlow?.id === 'guest_place_order') {
          if (normalized.includes('sign up')) {
            setTimeout(() => navigate('/auth/signup'), 1500);
          } else if (
            normalized.includes('already have an account') ||
            normalized.includes('sign in')
          ) {
            setTimeout(() => navigate('/auth/signin'), 1500);
          }
        }
      }, 1500);
    } catch {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (value: string) => {
    handleSend(value);
  };

  const handleEndChat = () => {
    // Show closing message, remove quick replies immediately
    setQuickReplies([]);
    setIsTyping(false);
    setMessages(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'printy' as ChatRole,
        text: 'Thank you for chatting with Printy! Have a great day. 👋',
        ts: Date.now(),
      },
    ]);
    // After a short delay, close panel and reset state
    setTimeout(() => {
      setIsChatOpen(false);
      setMessages([]);
      setCurrentFlow(null);
      setChatTitle('Chat');
      setInputPlaceholder('Type a message...');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <Container className="py-4 container-responsive">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <div>
                <Text
                  variant="h3"
                  size="lg"
                  weight="bold"
                  className="text-brand-primary"
                >
                  Printy
                </Text>
                <Text variant="p" size="xs" color="muted">
                  B.J. Santiago Inc.
                </Text>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                threeD
                onClick={() => navigate('/auth/signin')}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="sm"
                threeD
                onClick={() => navigate('/auth/signup')}
              >
                Sign Up
              </Button>
            </div>
          </div>
        </Container>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <Container className="container-responsive">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <div className="space-y-6">
              <Text
                variant="h1"
                size="6xl"
                weight="bold"
                className="text-brand-primary leading-tight text-center"
              >
                Introducing Printy
              </Text>
              <Text
                variant="p"
                size="xl"
                color="muted"
                className="leading-relaxed max-w-3xl mx-auto text-center"
              >
                For over 33 years, B.J. Santiago Inc. has delivered trusted
                printing solutions to businesses across the Philippines. Now,
                with Printy, our prompt-based chatbot assistant, we're making it
                easier than ever to browse services, place orders, track print
                jobs, and get instant support — all in one chat.
              </Text>
            </div>

            <div className="space-y-4 text-center">
              <Button
                variant="primary"
                size="lg"
                threeD
                onClick={scrollToChat}
                className="group btn-responsive-primary"
              >
                Try out Printy
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
        <Container className="container-responsive">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-brand-primary-100 rounded-full flex items-center justify-center mx-auto">
                <Printer className="w-8 h-8 text-brand-primary" />
              </div>
              <Text
                variant="h3"
                size="xl"
                weight="semibold"
                className="text-center"
              >
                Professional Printing
              </Text>
              <Text variant="p" color="muted">
                Offset, digital, and large format printing with 33+ years of
                expertise
              </Text>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-brand-accent-100 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="w-8 h-8 text-brand-accent" />
              </div>
              <Text
                variant="h3"
                size="xl"
                weight="semibold"
                className="text-center"
              >
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
              <Text
                variant="h3"
                size="xl"
                weight="semibold"
                className="text-center"
              >
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
      <section
        id="chat-section"
        className="py-20 bg-gradient-to-br from-brand-primary-50 to-white"
      >
        <Container className="container-responsive">
          <div className="max-w-4xl mx-auto">
            <div className="text-center space-y-8 mb-12">
              <Text
                variant="h2"
                size="4xl"
                weight="bold"
                className="text-brand-primary text-center"
              >
                Hi there! I'm Printy, your chatbot assistant!
              </Text>
              <Text variant="p" size="lg" color="muted" className="text-center">
                Choose a topic and chat right here.
              </Text>
            </div>

            {!isChatOpen ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <ActionCard
                  title="About Us"
                  description="Learn about our company history and values"
                  icon={<Users className="w-6 h-6" />}
                  onClick={() => initializeFlow('about')}
                />

                <ActionCard
                  title="FAQs"
                  description="Find answers to common questions"
                  icon={<MessageCircle className="w-6 h-6" />}
                  onClick={() => initializeFlow('faqs')}
                />

                <ActionCard
                  title="Services Offered"
                  description="Explore our printing solutions"
                  icon={<Award className="w-6 h-6" />}
                  onClick={() => initializeFlow('about')}
                />

                <ActionCard
                  title="Place an Order"
                  description="Start your printing project"
                  icon={<Printer className="w-6 h-6" />}
                  onClick={() => initializeFlow('place-order')}
                />
              </div>
            ) : (
              <div className="mt-8">
                <GuestChatPanel
                  title={chatTitle}
                  messages={messages}
                  onSend={handleSend}
                  isTyping={isTyping}
                  quickReplies={quickReplies}
                  onQuickReply={handleQuickReply}
                  inputPlaceholder={inputPlaceholder}
                  onEndChat={handleEndChat}
                  showAttach={false}
                />
              </div>
            )}
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
  onClick?: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  onClick,
}) => (
  <div
    onClick={onClick}
    className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-neutral-200 hover:border-brand-primary/20 hover:-translate-y-1"
  >
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-brand-primary-100 rounded-lg flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <Text
          variant="h4"
          size="lg"
          weight="semibold"
          className="group-hover:text-brand-primary transition-colors"
        >
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
