import type { ChatFlow, BotMessage } from '../../../types/chatFlow';
import { mockServices } from '../../../data/services';

type Status = 'Active' | 'Inactive' | 'Retired';

type NodeId = 
  | 'start'
  | 'action'
  | 'edit_service'
  | 'edit_category'
  | 'edit_status'
  | 'edit_name'
  | 'move_category'
  | 'choose_category'
  | 'add_service'
  | 'done';

const STATUS_OPTIONS: Status[] = ['Active', 'Inactive', 'Retired'];

function normalizeServiceStatus(input: string): Status | null {
  const t = (input || '').toLowerCase();
  if (t.startsWith('act')) return 'Active';
  if (t.startsWith('inact') || t.startsWith('deac') || t.startsWith('dis')) return 'Inactive';
  if (t.startsWith('ret') || t.startsWith('arch')) return 'Retired';
  return null;
}

let currentNodeId: NodeId = 'action';
let currentServiceId: string | null = null;
let currentServices: any[] = [];
let updateServiceRef: ((serviceId: string, updates: Partial<any>) => void) | null = null;
let refreshServicesRef: (() => void) | null = null;

function getExistingCategories(): string[] {
  const categories = new Set<string>();
  currentServices.forEach(service => {
    if (service.category) {
      categories.add(service.category);
    }
  });
  return Array.from(categories).sort();
}

function findService(idOrCode: string) {
  const id = (idOrCode || '').toUpperCase();
  return currentServices.find(s => 
    (s.id || '').toUpperCase() === id || 
    (s.code || '').toUpperCase() === id
  ) || mockServices.find(s => 
    (s.id || '').toUpperCase() === id || 
    (s.code || '').toUpperCase() === id
  );
}

function nodeToMessages(node: NodeId): BotMessage[] {
  const service = currentServiceId ? findService(currentServiceId) : null;
  
  switch (node) {
    case 'start':
    case 'action': {
      if (service) {
        return [
          { 
            role: 'printy', 
            text: `Looking at ${service.name} (${service.code}). Current status: ${service.status}. What would you like to do?` 
          }
        ];
      }
      return [
        { 
          role: 'printy', 
          text: 'Portfolio assistant ready. What would you like to do?' 
        }
      ];
    }
    case 'edit_service': {
      if (!service) return [];
      return [
        { 
          role: 'printy', 
          text: `What would you like to edit for ${service.name}?` 
        }
      ];
    }
    case 'edit_category': {
      if (!service) return [];
      return [
        { 
          role: 'printy', 
          text: `Current category: ${service.category}. What should the new category be?` 
        }
      ];
    }
    case 'edit_status': {
      if (!service) return [];
      return [
        { 
          role: 'printy', 
          text: `Current status: ${service.status}. What should the new status be?` 
        }
      ];
    }
    case 'edit_name': {
      if (!service) return [];
      return [
        { 
          role: 'printy', 
          text: `Current name: ${service.name}. What should the new name be?` 
        }
      ];
    }
    case 'move_category': {
      if (!service) return [];
      const categories = getExistingCategories();
      const otherCategories = categories.filter(cat => cat !== service.category);
      return [
        { 
          role: 'printy', 
          text: `Moving ${service.name} from "${service.category}" to another category.` 
        },
        { 
          role: 'printy', 
          text: `Available categories: ${otherCategories.join(', ')}` 
        }
      ];
    }
    case 'choose_category': {
      if (!service) return [];
      return [
        { 
          role: 'printy', 
          text: `Which category should ${service.name} be moved to?` 
        }
      ];
    }
    case 'add_service': {
      return [
        { 
          role: 'printy', 
          text: 'To add a new service, provide: Name=Service Name; Code=SRV-XXX; Category=Category Name' 
        }
      ];
    }
    case 'done':
      return [{ role: 'printy', text: 'Done. Anything else?' }];
  }
}

function nodeQuickReplies(node: NodeId): string[] {
  switch (node) {
    case 'start':
    case 'action':
      return currentServiceId 
        ? ['Edit Service', 'End Chat'] 
        : ['Add Service', 'End Chat'];
    case 'edit_service':
      return ['Edit Name', 'Edit Category', 'Move to Another Category', 'Edit Status', 'End Chat'];
    case 'edit_category':
    case 'edit_name':
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
    case 'add_service':
      return ['End Chat'];
    case 'done':
      return ['Edit Service', 'End Chat'];
  }
}

export const portfolioFlow: ChatFlow = {
  id: 'admin-portfolio',
  title: 'Admin Portfolio',
  initial: (ctx) => {
    currentServiceId = (ctx?.serviceId as string) || null;
    updateServiceRef = (ctx?.updateService as any) || null;
    currentServices = (ctx?.services as any[]) || mockServices;
    refreshServicesRef = (ctx?.refreshServices as any) || null;
    currentNodeId = 'action';
    return nodeToMessages(currentNodeId);
  },
  quickReplies: () => nodeQuickReplies(currentNodeId),
  respond: async (_ctx, input) => {
    const text = input.trim();
    const lower = text.toLowerCase();

    // End chat
    if (lower === 'end chat' || lower === 'end') {
      return { 
        messages: [{ role: 'printy', text: 'Thanks! Chat ended.' }], 
        quickReplies: ['End Chat'] 
      };
    }

    // Action selection
    if (currentNodeId === 'action' || currentNodeId === 'start') {
      if (lower === 'edit service' || lower === 'edit') {
        currentNodeId = 'edit_service';
        return { 
          messages: nodeToMessages(currentNodeId), 
          quickReplies: nodeQuickReplies(currentNodeId) 
        };
      }
      if (lower === 'add service' || lower === 'add') {
        currentNodeId = 'add_service';
        return { 
          messages: nodeToMessages(currentNodeId), 
          quickReplies: nodeQuickReplies(currentNodeId) 
        };
      }
      return { 
        messages: nodeToMessages('action'), 
        quickReplies: nodeQuickReplies('action') 
      };
    }

    // Edit service selection
    if (currentNodeId === 'edit_service') {
      if (lower === 'edit name' || lower === 'name') {
        currentNodeId = 'edit_name';
        return { 
          messages: nodeToMessages(currentNodeId), 
          quickReplies: nodeQuickReplies(currentNodeId) 
        };
      }
      if (lower === 'edit category' || lower === 'category') {
        currentNodeId = 'edit_category';
        return { 
          messages: nodeToMessages(currentNodeId), 
          quickReplies: nodeQuickReplies(currentNodeId) 
        };
      }
      if (lower === 'edit status' || lower === 'status') {
        currentNodeId = 'edit_status';
        return { 
          messages: nodeToMessages(currentNodeId), 
          quickReplies: nodeQuickReplies(currentNodeId) 
        };
      }
      if (lower === 'move to another category' || lower === 'move category') {
        currentNodeId = 'move_category';
        return { 
          messages: nodeToMessages(currentNodeId), 
          quickReplies: nodeQuickReplies(currentNodeId) 
        };
      }
      return { 
        messages: nodeToMessages('edit_service'), 
        quickReplies: nodeQuickReplies('edit_service') 
      };
    }

    // Edit name
    if (currentNodeId === 'edit_name' && currentServiceId) {
      const service = findService(currentServiceId);
      if (!service) return { 
        messages: nodeToMessages('action'), 
        quickReplies: nodeQuickReplies('action') 
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
        currentServices = currentServices.map(s => 
          s.id === service.id ? { ...s, name: newName } : s
        );
      }

      currentNodeId = 'action';
      return { 
        messages: [{ 
          role: 'printy', 
          text: `✅ Updated ${service.code} name: "${service.name}" → "${newName}"` 
        }], 
        quickReplies: nodeQuickReplies(currentNodeId) 
      };
    }

    // Edit category
    if (currentNodeId === 'edit_category' && currentServiceId) {
      const service = findService(currentServiceId);
      if (!service) return { 
        messages: nodeToMessages('action'), 
        quickReplies: nodeQuickReplies('action') 
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
        currentServices = currentServices.map(s => 
          s.id === service.id ? { ...s, category: newCategory } : s
        );
      }

      currentNodeId = 'action';
      return { 
        messages: [{ 
          role: 'printy', 
          text: `✅ Updated ${service.code} category: "${service.category}" → "${newCategory}"` 
        }], 
        quickReplies: nodeQuickReplies(currentNodeId) 
      };
    }

    // Edit status
    if (currentNodeId === 'edit_status' && currentServiceId) {
      const service = findService(currentServiceId);
      if (!service) return { 
        messages: nodeToMessages('action'), 
        quickReplies: nodeQuickReplies('action') 
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
        currentServices = currentServices.map(s => 
          s.id === service.id ? { ...s, status: newStatus } : s
        );
      }

      currentNodeId = 'action';
      return { 
        messages: [{ 
          role: 'printy', 
          text: `✅ Updated ${service.code} status: ${service.status} → ${newStatus}` 
        }], 
        quickReplies: nodeQuickReplies(currentNodeId) 
      };
    }

    // Move category
    if (currentNodeId === 'move_category' && currentServiceId) {
      const service = findService(currentServiceId);
      if (!service) return { 
        messages: nodeToMessages('action'), 
        quickReplies: nodeQuickReplies('action') 
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
        currentServices = currentServices.map(s => 
          s.id === service.id ? { ...s, category: selectedCategory } : s
        );
      }

      currentNodeId = 'action';
      return { 
        messages: [{ 
          role: 'printy', 
          text: `✅ Moved ${service.name} from "${service.category}" to "${selectedCategory}"` 
        }], 
        quickReplies: nodeQuickReplies(currentNodeId) 
      };
    }

    // Add service
    if (currentNodeId === 'add_service') {
      const addMatch = /name=(.+?);\s*code=(.+?);\s*category=(.+)$/i.exec(text);
      if (addMatch) {
        const name = addMatch[1].trim();
        const code = addMatch[2].trim().toUpperCase();
        const category = addMatch[3].trim();
        
        return {
          messages: [
            {
              role: 'printy',
              text: `Creating service ${name} (${code}) in category "${category}"…`,
            },
            {
              role: 'printy',
              text: 'Mock service created (status Active by default).',
            },
          ],
          quickReplies: ['End Chat'],
        };
      }
      
      return {
        messages: [
          {
            role: 'printy',
            text: 'Please provide: Name=Service Name; Code=SRV-XXX; Category=Category Name',
          },
        ],
        quickReplies: nodeQuickReplies('add_service'),
      };
    }

    // Fallback
    return { 
      messages: [{ role: 'printy', text: 'Please use the options below.' }], 
      quickReplies: nodeQuickReplies(currentNodeId) 
    };
  },
};
