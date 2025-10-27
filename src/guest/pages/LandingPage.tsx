import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Text } from '@shared/components';
import { MessageCircle, Printer, Users, Award } from 'lucide-react';
import GuestChatPanel from '../components/chat/GuestChatPanel';
import {
  type ChatMessage,
  type QuickReply,
  type ChatRole,
} from '@features/chat/types/chat';
import { supabase } from '@lib/supabase';
import type { FlowDefinition } from '@features/chat/types/flow';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = React.useState(false);
  const [quickReplies, setQuickReplies] = React.useState<QuickReply[]>([]);
  const [currentFlow, setCurrentFlow] = React.useState<FlowDefinition | null>(
    null
  );
  const [currentNodeId, setCurrentNodeId] = React.useState<string>('');
  const [chatTitle, setChatTitle] = React.useState<string>('Chat');
  const [inputPlaceholder, setInputPlaceholder] =
    React.useState('Type a message...');
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const scrollToChat = () => {
    document.getElementById('chat-section')?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  const initializeFlow = async (flowKey: 'about' | 'faqs' | 'guest-services-offered') => {
    setIsTyping(true);
    setMessages([]);
    setQuickReplies([]);

    try {
      // Map flow keys to database flow IDs
      const flowIdMap: Record<string, string> = {
        about: 'guest-about-us',
        faqs: 'guest-faqs',
        'guest-services-offered': 'guest-services-offered',
      };

      const flowId = flowIdMap[flowKey];
      if (!flowId) {
        console.error('Unknown flow key:', flowKey);
        setIsTyping(false);
        return;
      }

      // Fetch flow definition from database
      const { data: flowData, error } = await supabase
        .from('chat_flows_v2')
        .select('flow_definition')
        .eq('flow_id', flowId)
        .eq('flow_owner', 'guest')
        .single();

      if (error || !flowData) {
        console.error('Error fetching flow:', error);
        setIsTyping(false);
        return;
      }

      const flowDefinition = flowData.flow_definition as FlowDefinition;
      setCurrentFlow(flowDefinition);
      setChatTitle(flowDefinition.title);
      setCurrentNodeId(flowDefinition.initial_node);

      // Process initial node
      const initialNode = flowDefinition.nodes[flowDefinition.initial_node];
      if (initialNode) {
        if (initialNode.type === 'message') {
          const botMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'printy',
            text: initialNode.message as string,
            ts: Date.now(),
          };
          setMessages([botMessage]);

          // Set quick replies from initial node options
          if (initialNode.options) {
            const replies = initialNode.options.map((option, index) => ({
              id: `qr-${index}`,
              label: option.label,
              value: option.label,
            }));
            setQuickReplies(replies);
          }
                          } else if (initialNode.type === 'action' && initialNode.action === 'display_service_categories') {
            // Handle display_service_categories action for guest users
            try {
              // Fetch active service categories
              const { data: categories, error } = await supabase
                .from('service_categories')
                .select('category_id, category_name, description')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

              if (error || !categories || categories.length === 0) {
                const botMessage: ChatMessage = {
                  id: crypto.randomUUID(),
                  role: 'printy',
                  text: 'No service categories are available at the moment.',
                  ts: Date.now(),
                };
                setMessages([botMessage]);
              } else {
                // Add welcome message
                const welcomeMessage: ChatMessage = {
                  id: crypto.randomUUID(),
                  role: 'printy',
                  text: "Hi! I'm Printy, B.J. Santiago's bot assistant. Here you can browse all our active printing services organized by category. What would you like to explore?",
                  ts: Date.now(),
                };
                setMessages([welcomeMessage]);

                // Generate quick replies for categories
                const replies = categories.map((category, index) => ({
                  id: `cat-${index}`,
                  label: category.category_name,
                  value: category.category_id,
                }));
                
                // Add End Chat option
                replies.push({
                  id: 'end-chat',
                  label: 'End Chat',
                  value: 'end',
                });
                
                setQuickReplies(replies);
              }
            } catch (error) {
              console.error('Error fetching categories:', error);
              const botMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'printy',
                text: 'Something went wrong while loading service categories. Please try again.',
                ts: Date.now(),
              };
              setMessages([botMessage]);
            }
          }
      }

      setIsChatOpen(true);
      setInputPlaceholder('Type a message...');
      setIsTyping(false);
      document
        .getElementById('chat-section')
        ?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Error initializing flow:', error);
      setIsTyping(false);
    }
  };

  const handleSend = async (text: string) => {
    if (!currentFlow || !currentNodeId) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      ts: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    // Store quickReplies before clearing
    const previousQuickReplies = [...quickReplies];
    setQuickReplies([]);

    try {
      const currentNode = currentFlow.nodes[currentNodeId];
      
      // Handle services flow - check if we're in category selection mode
      // ONLY detect services flow if we have 'cat-' prefixed replies (category buttons)
      const isServicesFlow = previousQuickReplies.length > 0 && 
        previousQuickReplies.some(qr => qr.id?.startsWith('cat-')) &&
        !previousQuickReplies.some(qr => qr.id?.startsWith('qr-'));
      
      if (isServicesFlow) {
        // Handle End Chat option
        if (text.trim().toLowerCase() === 'end chat') {
          const endNode = currentFlow.nodes['end'];
          if (endNode && endNode.type === 'end') {
            const endMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: 'printy',
              text: endNode.message as string,
              ts: Date.now(),
            };
            setMessages(prev => [...prev, endMessage]);
            setQuickReplies([]);
          }
          return;
        }
        
        // This is a category selection from the services flow
        // Find the matching category by label (case-insensitive, partial match)
        const normalizedText = text.trim().toLowerCase();
        let selectedCategory = previousQuickReplies.find(qr => 
          qr.label.toLowerCase() === normalizedText
        );
        
        // If no exact match, try to find by checking if any category label contains the input
        if (!selectedCategory) {
          selectedCategory = previousQuickReplies.find(qr => 
            qr.label.toLowerCase().includes(normalizedText) && qr.value !== 'end'
          );
        }
        
        if (selectedCategory && selectedCategory.value !== 'end') {
          // Fetch services for this category
          try {
            const { data: services, error } = await supabase
              .from('printing_services')
              .select('service_name, description')
              .eq('category_id', selectedCategory.value)
              .eq('status', 'active');

            if (error || !services || services.length === 0) {
              const botMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: 'printy',
                text: `No active services found in the ${selectedCategory.label} category.`,
                ts: Date.now(),
              };
              setMessages(prev => [...prev, botMessage]);
              
              // Show category options again
              const { data: categories } = await supabase
                .from('service_categories')
                .select('category_id, category_name')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

              if (categories) {
                const replies = categories.map((cat, idx) => ({
                  id: `cat-${idx}`,
                  label: cat.category_name,
                  value: cat.category_id,
                }));
                
                // Add End Chat option
                replies.push({
                  id: 'end-chat',
                  label: 'End Chat',
                  value: 'end',
                });
                
                setQuickReplies(replies);
              }
                         } else {
               // Display services
               const servicesText = services
                 .map(s => `• ${s.service_name}${s.description ? ` - ${s.description}` : ''}`)
                 .join('\n');
               
                               const botMessage: ChatMessage = {
                  id: crypto.randomUUID(),
                  role: 'printy',
                  text: `Here are our ${selectedCategory.label} services:\n\n${servicesText}`,
                  ts: Date.now(),
                };
               setMessages(prev => [...prev, botMessage]);

               // Show category options again so user can browse more
               const { data: categories } = await supabase
                 .from('service_categories')
                 .select('category_id, category_name')
                 .eq('is_active', true)
                 .order('display_order', { ascending: true });

               if (categories) {
                 const replies = categories.map((cat, idx) => ({
                   id: `cat-${idx}`,
                   label: cat.category_name,
                   value: cat.category_id,
                 }));
                 
                 // Add End Chat option
                 replies.push({
                   id: 'end-chat',
                   label: 'End Chat',
                   value: 'end',
                 });
                 
                 setQuickReplies(replies);
               }
             }
          } catch (error) {
            console.error('Error fetching services:', error);
          }
        }
      }
      // Handle regular message node flow
      else if (currentNode && currentNode.type === 'message' && currentNode.options) {
        const selectedOption = currentNode.options.find(
          option => option.label.toLowerCase() === text.trim().toLowerCase()
        );

        if (selectedOption) {
          const nextNodeId = selectedOption.next;
          if (nextNodeId) {
            setCurrentNodeId(nextNodeId);
            const nextNode = currentFlow.nodes[nextNodeId];

            if (nextNode) {
              if (nextNode.type === 'message') {
                const botMessage: ChatMessage = {
                  id: crypto.randomUUID(),
                  role: 'printy',
                  text: nextNode.message as string,
                  ts: Date.now(),
                };
                setMessages(prev => [...prev, botMessage]);

                if (nextNode.options) {
                  const replies = nextNode.options.map((option, index) => ({
                    id: `qr-${index}`,
                    label: option.label,
                    value: option.label,
                  }));
                  setQuickReplies(replies);
                }
              } else if (nextNode.type === 'end') {
                const endMessage: ChatMessage = {
                  id: crypto.randomUUID(),
                  role: 'printy',
                  text: nextNode.message as string,
                  ts: Date.now(),
                };
                setMessages(prev => [...prev, endMessage]);
                setQuickReplies([]);
              }
            }
          }
        } else {
          const errorMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Please choose one of the available options.',
            ts: Date.now(),
          };
          setMessages(prev => [...prev, errorMessage]);

          if (currentNode.options) {
            const replies = currentNode.options.map((option, index) => ({
              id: `qr-${index}`,
              label: option.label,
              value: option.label,
            }));
            setQuickReplies(replies);
          }
        }
      }

      setIsTyping(false);
    } catch (error) {
      console.error('Error processing message:', error);
      setIsTyping(false);
    }
  };

  const handleQuickReply = (value: string | { value: string; label: string }) => {
    // Handle both string and object formats
    const data = typeof value === 'string' ? { value, label: value } : value;
    // Use the label for display but the value for routing
    handleSend(data.label);
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
        text: 'Thank you for chatting with Printy! Have a great day.',
        ts: Date.now(),
      },
    ]);
    // Close panel and reset state after 3 seconds
    setTimeout(() => {
      setIsChatOpen(false);
      setMessages([]);
      setCurrentFlow(null);
      setCurrentNodeId('');
      setChatTitle('Chat');
      setInputPlaceholder('Type a message...');
    }, 3000);
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
                  title="About B.J. Santiago Inc."
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
                  onClick={() => initializeFlow('guest-services-offered')}
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
