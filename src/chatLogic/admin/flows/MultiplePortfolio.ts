import type { ChatFlow, BotMessage } from '../../../types/chatFlow';
import { mockServices } from '../../../data/services';

type Status = 'Active' | 'Inactive' | 'Retired';

type NodeId =
  | 'multi_start'          // show selected + ask action
  | 'action'               // quick replies: Edit Service, End Chat
  | 'choose_service'       // quick replies: [Service Codes..., End Chat]
  | 'edit_service'         // quick replies: Edit Name, Edit Category, Edit Status, Move Category, End Chat
  | 'edit_name'            // expects new name input
  | 'edit_category'        // expects new category input
  | 'edit_status'          // quick replies: status list
  | 'move_category'        // quick replies: available categories
  | 'choose_category'      // quick replies: available categories
  | 'done';                // quick replies: Edit Service, End Chat

const STATUS_OPTIONS: Status[] = ['Active', 'Inactive', 'Retired'];

function normalizeServiceStatus(input: string): Status | null {
  const t = (input || '').toLowerCase();
  if (t.startsWith('act')) return 'Active';
  if (t.startsWith('inact') || t.startsWith('deac') || t.startsWith('dis')) return 'Inactive';
  if (t.startsWith('ret') || t.startsWith('arch')) return 'Retired';
  return null;
}

// Session-scoped context
let currentNodeId: NodeId = 'multi_start';
let selectedServiceIds: string[] = [];
let servicesRef: any[] = [];
let updateServiceRef: ((serviceId: string, updates: Partial<any>) => void) | null = null;
let refreshServicesRef: (() => void) | null = null;
let currentServiceId: string | null = null;
let processedIds = new Set<string>();

function findService(idOrCode: string) {
  const id = (idOrCode || '').toUpperCase();
  console.log('🔍 Looking for service:', id);
  
  const foundInRef = servicesRef.find(s => 
    (s.id || '').toUpperCase() === id || 
    (s.code || '').toUpperCase() === id
  );
  
  const foundInMock = mockServices.find(s => 
    (s.id || '').toUpperCase() === id || 
    (s.code || '').toUpperCase() === id
  );
  
  const result = foundInRef || foundInMock;
  console.log('✅ Found service:', result);
  
  return result;
}

function getExistingCategories(): string[] {
  const categories = new Set<string>();
  servicesRef.forEach(service => {
    if (service.category) {
      categories.add(service.category);
    }
  });
  return Array.from(categories).sort();
}

function extractServiceCodes(text: string): string[] {
  const out: string[] = [];
  const re = /\bSRV-[A-Z0-9]+\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) out.push(m[0].toUpperCase());
  return out;
}

function nodeToMessages(node: NodeId): BotMessage[] {
  switch (node) {
    case 'multi_start': {
      const msgs: BotMessage[] = [
        { role: 'printy', text: `Multiple services assistant ready (${selectedServiceIds.length} selected).` },
        { role: 'printy', text: 'You selected:' },
      ];
      selectedServiceIds
        .map(id => findService(id))
        .filter(Boolean)
        .forEach((s: any) => msgs.push({ role: 'printy', text: `${s.code} • ${s.name} • ${s.status} • ${s.category}` }));
      msgs.push({ role: 'printy', text: 'What do you want to do with these services?' });
      return msgs;
    }
    case 'action':
      return []; // no extra text; quick replies guide
    case 'choose_service': {
      const remaining = selectedServiceIds.filter(id => !processedIds.has(id));
      return [{ role: 'printy', text: `Which service would you like to work on first? (${remaining.length} remaining)` }];
    }
    case 'edit_service': {
      const service = currentServiceId ? findService(currentServiceId) : null;
      if (!service) return [];
      return [
        { 
          role: 'printy', 
          text: `Working on ${service.name} (${service.code}). Current status: ${service.status}, Category: ${service.category}. What would you like to edit?` 
        }
      ];
    }
    case 'edit_name': {
      const service = currentServiceId ? findService(currentServiceId) : null;
      if (!service) return [];
      return [{ role: 'printy', text: `Current name: ${service.name}. What should the new name be?` }];
    }
    case 'edit_category': {
      const service = currentServiceId ? findService(currentServiceId) : null;
      if (!service) return [];
      return [{ role: 'printy', text: `Current category: ${service.category}. What should the new category be?` }];
    }
    case 'edit_status': {
      const service = currentServiceId ? findService(currentServiceId) : null;
      if (!service) return [];
      return [{ role: 'printy', text: `Current status: ${service.status}. What should the new status be?` }];
    }
    case 'move_category': {
      const service = currentServiceId ? findService(currentServiceId) : null;
      if (!service) return [];
      const categories = getExistingCategories();
      const otherCategories = categories.filter(cat => cat !== service.category);
      return [
        { role: 'printy', text: `Moving ${service.name} from "${service.category}" to another category.` },
        { role: 'printy', text: `Available categories: ${otherCategories.join(', ')}` }
      ];
    }
    case 'choose_category': {
      const service = currentServiceId ? findService(currentServiceId) : null;
      if (!service) return [];
      return [{ role: 'printy', text: `Which category should ${service.name} be moved to?` }];
    }
    case 'done':
      return [{ role: 'printy', text: 'All selected services have been processed. Anything else?' }];
  }
}

function nodeQuickReplies(node: NodeId): string[] {
  switch (node) {
    case 'multi_start':
    case 'action':
      return ['Edit Service', 'End Chat'];
    case 'choose_service': {
      const remaining = selectedServiceIds.filter(id => !processedIds.has(id));
      return remaining.map(id => {
        const service = findService(id);
        return service ? `${service.code} - ${service.name}` : id;
      }).concat(['End Chat']);
    }
    case 'edit_service':
      return ['Edit Name', 'Edit Category', 'Edit Status', 'Move Category', 'End Chat'];
    case 'edit_name':
    case 'edit_category':
      return ['End Chat'];
    case 'edit_status':
      return [...STATUS_OPTIONS, 'End Chat'];
    case 'move_category': {
      const service = currentServiceId ? findService(currentServiceId) : null;
      if (!service) return ['End Chat'];
      const categories = getExistingCategories();
      const otherCategories = categories.filter(cat => cat !== service.category);
      return [...otherCategories, 'End Chat'];
    }
    case 'choose_category': {
      const service = currentServiceId ? findService(currentServiceId) : null;
      if (!service) return ['End Chat'];
      const categories = getExistingCategories();
      const otherCategories = categories.filter(cat => cat !== service.category);
      return [...otherCategories, 'End Chat'];
    }
    case 'done':
      return ['Edit Service', 'End Chat'];
  }
}

export const multiplePortfolioFlow: ChatFlow = {
  id: 'admin-multiple-portfolio',
  title: 'Admin Multiple Portfolio',
  initial: (ctx) => {
    selectedServiceIds = Array.isArray(ctx?.serviceIds) ? (ctx?.serviceIds as string[]).map(x => x.toUpperCase()) : [];
    servicesRef = (ctx?.services as any[]) || mockServices;
    updateServiceRef = (ctx?.updateService as any) || null;
    refreshServicesRef = (ctx?.refreshServices as any) || null;
    processedIds = new Set<string>();
    currentServiceId = null;

    console.log('🎯 MultiplePortfolio Flow Initial');
    console.log('📋 Received serviceIds:', ctx?.serviceIds);
    console.log('📋 Processed selectedServiceIds:', selectedServiceIds);
    console.log('🗃️ servicesRef length:', servicesRef?.length);

    currentNodeId = selectedServiceIds.length > 1 ? 'multi_start' : 'action';
    console.log('🔄 Setting currentNodeId to:', currentNodeId);
    
    const messages = nodeToMessages(currentNodeId);
    console.log('💬 Generated messages:', messages);
    
    return messages;
  },
  quickReplies: () => nodeQuickReplies(currentNodeId),
  respond: async (_ctx, input) => {
    const text = input.trim();
    const lower = text.toLowerCase();

    // End chat at any time
    if (lower === 'end chat' || lower === 'end') {
      return { messages: [{ role: 'printy', text: 'Thanks! Chat ended.' }], quickReplies: ['End Chat'] };
    }

    // Flow transitions
    if (currentNodeId === 'multi_start' || currentNodeId === 'action') {
      if (lower === 'edit service' || lower === 'edit') {
        currentNodeId = 'choose_service';
        return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
      }
      return { messages: [{ role: 'printy', text: `You selected ${selectedServiceIds.length} services. What do you want to do with these services?` }], quickReplies: nodeQuickReplies('action') };
    }

    if (currentNodeId === 'choose_service') {
      const remaining = selectedServiceIds.filter(id => !processedIds.has(id));
      const codes = extractServiceCodes(text);
      const serviceCode = codes[0] || remaining.find(id => {
        const service = findService(id);
        return service && (service.code.toLowerCase() === lower || service.name.toLowerCase().includes(lower));
      });
      
      if (!serviceCode || !remaining.includes(serviceCode)) {
        return { messages: [{ role: 'printy', text: 'Please pick one of the selected services.' }], quickReplies: nodeQuickReplies('choose_service') };
      }
      
      currentServiceId = serviceCode;
      currentNodeId = 'edit_service';
      return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
    }

    if (currentNodeId === 'edit_service') {
      if (lower === 'edit name' || lower === 'name') {
        currentNodeId = 'edit_name';
        return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
      }
      if (lower === 'edit category' || lower === 'category') {
        currentNodeId = 'edit_category';
        return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
      }
      if (lower === 'edit status' || lower === 'status') {
        currentNodeId = 'edit_status';
        return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
      }
      if (lower === 'move category' || lower === 'move') {
        currentNodeId = 'move_category';
        return { messages: nodeToMessages(currentNodeId), quickReplies: nodeQuickReplies(currentNodeId) };
      }
      return { messages: nodeToMessages('edit_service'), quickReplies: nodeQuickReplies('edit_service') };
    }

    // Edit name
    if (currentNodeId === 'edit_name' && currentServiceId) {
      const service = findService(currentServiceId);
      if (!service) return { 
        messages: nodeToMessages('choose_service'), 
        quickReplies: nodeQuickReplies('choose_service') 
      };
      
      const newName = text.trim();
      if (!newName) {
        return { 
          messages: [{ role: 'printy', text: 'Please provide a new name for the service.' }], 
          quickReplies: nodeQuickReplies('edit_name') 
        };
      }

      if (updateServiceRef) updateServiceRef(service.id, { name: newName });
      const mi = mockServices.findIndex(s => s.id === service.id);
      if (mi !== -1) mockServices[mi].name = newName;
      if (refreshServicesRef) {
        refreshServicesRef();
        servicesRef = servicesRef.map(s => 
          s.id === service.id ? { ...s, name: newName } : s
        );
      }

      processedIds.add(currentServiceId);
      const remaining = selectedServiceIds.filter(id => !processedIds.has(id));
      const msgs: BotMessage[] = [{ 
        role: 'printy', 
        text: `✅ Updated ${service.code} name: "${service.name}" → "${newName}"` 
      }];

      if (remaining.length > 0) {
        currentServiceId = null;
        currentNodeId = 'choose_service';
        msgs.push({ role: 'printy', text: `Next service to work on? (${remaining.length} remaining)` });
        return { messages: msgs, quickReplies: nodeQuickReplies(currentNodeId) };
      }
      
      currentNodeId = 'done';
      msgs.push(...nodeToMessages(currentNodeId));
      return { messages: msgs, quickReplies: nodeQuickReplies(currentNodeId) };
    }

    // Edit category
    if (currentNodeId === 'edit_category' && currentServiceId) {
      const service = findService(currentServiceId);
      if (!service) return { 
        messages: nodeToMessages('choose_service'), 
        quickReplies: nodeQuickReplies('choose_service') 
      };
      
      const newCategory = text.trim();
      if (!newCategory) {
        return { 
          messages: [{ role: 'printy', text: 'Please provide a new category for the service.' }], 
          quickReplies: nodeQuickReplies('edit_category') 
        };
      }

      if (updateServiceRef) updateServiceRef(service.id, { category: newCategory });
      const mi = mockServices.findIndex(s => s.id === service.id);
      if (mi !== -1) mockServices[mi].category = newCategory;
      if (refreshServicesRef) {
        refreshServicesRef();
        servicesRef = servicesRef.map(s => 
          s.id === service.id ? { ...s, category: newCategory } : s
        );
      }

      processedIds.add(currentServiceId);
      const remaining = selectedServiceIds.filter(id => !processedIds.has(id));
      const msgs: BotMessage[] = [{ 
        role: 'printy', 
        text: `✅ Updated ${service.code} category: "${service.category}" → "${newCategory}"` 
      }];

      if (remaining.length > 0) {
        currentServiceId = null;
        currentNodeId = 'choose_service';
        msgs.push({ role: 'printy', text: `Next service to work on? (${remaining.length} remaining)` });
        return { messages: msgs, quickReplies: nodeQuickReplies(currentNodeId) };
      }
      
      currentNodeId = 'done';
      msgs.push(...nodeToMessages(currentNodeId));
      return { messages: msgs, quickReplies: nodeQuickReplies(currentNodeId) };
    }

    // Edit status
    if (currentNodeId === 'edit_status' && currentServiceId) {
      const service = findService(currentServiceId);
      if (!service) return { 
        messages: nodeToMessages('choose_service'), 
        quickReplies: nodeQuickReplies('choose_service') 
      };
      
      const newStatus = normalizeServiceStatus(lower);
      if (!newStatus) {
        return { 
          messages: [{ 
            role: 'printy', 
            text: `Valid statuses: ${STATUS_OPTIONS.join(', ')}` 
          }], 
          quickReplies: nodeQuickReplies('edit_status') 
        };
      }

      if (updateServiceRef) updateServiceRef(service.id, { status: newStatus as any });
      const mi = mockServices.findIndex(s => s.id === service.id);
      if (mi !== -1) (mockServices[mi] as any).status = newStatus;
      if (refreshServicesRef) {
        refreshServicesRef();
        servicesRef = servicesRef.map(s => 
          s.id === service.id ? { ...s, status: newStatus } : s
        );
      }

      processedIds.add(currentServiceId);
      const remaining = selectedServiceIds.filter(id => !processedIds.has(id));
      const msgs: BotMessage[] = [{ 
        role: 'printy', 
        text: `✅ Updated ${service.code} status: ${service.status} → ${newStatus}` 
      }];

      if (remaining.length > 0) {
        currentServiceId = null;
        currentNodeId = 'choose_service';
        msgs.push({ role: 'printy', text: `Next service to work on? (${remaining.length} remaining)` });
        return { messages: msgs, quickReplies: nodeQuickReplies(currentNodeId) };
      }
      
      currentNodeId = 'done';
      msgs.push(...nodeToMessages(currentNodeId));
      return { messages: msgs, quickReplies: nodeQuickReplies(currentNodeId) };
    }

    // Move category
    if (currentNodeId === 'move_category' && currentServiceId) {
      const service = findService(currentServiceId);
      if (!service) return { 
        messages: nodeToMessages('choose_service'), 
        quickReplies: nodeQuickReplies('choose_service') 
      };
      
      const categories = getExistingCategories();
      const otherCategories = categories.filter(cat => cat !== service.category);
      const selectedCategory = otherCategories.find(cat => 
        cat.toLowerCase() === lower || 
        cat.toLowerCase().includes(lower) ||
        lower.includes(cat.toLowerCase())
      );
      
      if (!selectedCategory) {
        return { 
          messages: [{ 
            role: 'printy', 
            text: `Please select a valid category: ${otherCategories.join(', ')}` 
          }], 
          quickReplies: nodeQuickReplies('move_category') 
        };
      }

      if (updateServiceRef) updateServiceRef(service.id, { category: selectedCategory });
      const mi = mockServices.findIndex(s => s.id === service.id);
      if (mi !== -1) (mockServices[mi] as any).category = selectedCategory;
      if (refreshServicesRef) {
        refreshServicesRef();
        servicesRef = servicesRef.map(s => 
          s.id === service.id ? { ...s, category: selectedCategory } : s
        );
      }

      processedIds.add(currentServiceId);
      const remaining = selectedServiceIds.filter(id => !processedIds.has(id));
      const msgs: BotMessage[] = [{ 
        role: 'printy', 
        text: `✅ Moved ${service.name} from "${service.category}" to "${selectedCategory}"` 
      }];

      if (remaining.length > 0) {
        currentServiceId = null;
        currentNodeId = 'choose_service';
        msgs.push({ role: 'printy', text: `Next service to work on? (${remaining.length} remaining)` });
        return { messages: msgs, quickReplies: nodeQuickReplies(currentNodeId) };
      }
      
      currentNodeId = 'done';
      msgs.push(...nodeToMessages(currentNodeId));
      return { messages: msgs, quickReplies: nodeQuickReplies(currentNodeId) };
    }

    // Fallback
    return { 
      messages: [{ role: 'printy', text: 'Please use the options below.' }], 
      quickReplies: nodeQuickReplies(currentNodeId) 
    };
  },
};
