// Refactored Portfolio Flow using shared utilities and base framework

// BACKEND_TODO: Remove mockServices import; rely solely on context-provided services from Supabase.
import { mockServices } from '../../../data/services'; // DELETE when backend is wired
import {
  FlowBase,
  SERVICE_STATUS_OPTIONS,
  createServiceUpdatedMessage,
} from '../shared';
import { normalizeServiceStatus } from '../shared/utils/StatusNormalizers';
import type { FlowState, FlowContext, NodeHandler } from '../shared';

type PortfolioNodeId =
  | 'action'
  | 'edit_service'
  | 'edit_category'
  | 'edit_status'
  | 'edit_name'
  | 'move_category'
  | 'choose_category'
  | 'add_service'
  | 'done';

interface PortfolioState extends FlowState {
  currentNodeId: PortfolioNodeId;
  currentServiceId: string | null;
  currentServices: any[];
}

class PortfolioFlow extends FlowBase {
  id = 'admin-portfolio';
  title = 'Admin Portfolio';

  constructor() {
    super({
      currentNodeId: 'action',
      currentServiceId: null,
      currentServices: [],
    });
    this.registerNodes();
  }

  protected initializeState(context: FlowContext): void {
    this.state.currentServiceId = (context?.serviceId as string) || null;
    this.state.currentServices = (context?.services as any[]) || mockServices;
    this.state.currentNodeId = 'action';
  }

  private registerNodes(): void {
    // Action node
    this.registerNode('action', this.createActionNode());

    // Edit service node
    this.registerNode('edit_service', this.createEditServiceNode());

    // Edit name node
    this.registerNode('edit_name', this.createEditNameNode());

    // Edit category node
    this.registerNode('edit_category', this.createEditCategoryNode());

    // Edit status node
    this.registerNode('edit_status', this.createEditStatusNode());

    // Move category node
    this.registerNode('move_category', this.createMoveCategoryNode());

    // Choose category node
    this.registerNode('choose_category', this.createChooseCategoryNode());

    // Add service node
    this.registerNode('add_service', this.createAddServiceNode());

    // Done node
    this.registerNode('done', this.createDoneNode());
  }

  private getExistingCategories(): string[] {
    const categories = new Set<string>();
    this.state.currentServices.forEach((service: any) => {
      if (service.category) {
        categories.add(service.category);
      }
    });
    return Array.from(categories).sort();
  }

  private findService(idOrCode: string): any {
    const id = (idOrCode || '').toUpperCase();
    return (
      this.state.currentServices.find(
        (s: any) =>
          (s.id || '').toUpperCase() === id ||
          (s.code || '').toUpperCase() === id
      ) ||
      mockServices.find(
        (s: any) =>
          (s.id || '').toUpperCase() === id ||
          (s.code || '').toUpperCase() === id
      )
    );
  }

  private getCurrentService(): any {
    const serviceState = this.state as PortfolioState;
    if (!serviceState.currentServiceId) return null;
    return this.findService(serviceState.currentServiceId);
  }

  private createActionNode(): NodeHandler {
    return {
      messages: () => {
        const service = this.getCurrentService();

        if (service) {
          return [
            {
              role: 'printy',
              text: `Looking at ${service.name} (${service.code}). Current status: ${service.status}. What would you like to do?`,
            },
          ];
        }
        return [
          {
            role: 'printy',
            text: 'Portfolio assistant ready. What would you like to do?',
          },
        ];
      },
      quickReplies: () => {
        const serviceState = this.state as PortfolioState;
        return serviceState.currentServiceId
          ? ['Edit Service', 'End Chat']
          : ['Add Service', 'End Chat'];
      },
      handleInput: (input: string) => {
        const lower = input.toLowerCase();

        if (lower === 'edit service' || lower === 'edit') {
          return { nextNodeId: 'edit_service' };
        }

        if (lower === 'add service' || lower === 'add') {
          return { nextNodeId: 'add_service' };
        }

        return null;
      },
    };
  }

  private createEditServiceNode(): NodeHandler {
    return {
      messages: () => {
        const service = this.getCurrentService();
        if (!service) return [{ role: 'printy', text: 'Service not found.' }];
        return [
          {
            role: 'printy',
            text: `What would you like to edit for ${service.name}?`,
          },
        ];
      },
      quickReplies: () => [
        'Edit Name',
        'Edit Category',
        'Move to Another Category',
        'Edit Status',
        'End Chat',
      ],
      handleInput: (input: string) => {
        const lower = input.toLowerCase();

        if (lower === 'edit name' || lower === 'name') {
          return { nextNodeId: 'edit_name' };
        }

        if (lower === 'edit category' || lower === 'category') {
          return { nextNodeId: 'edit_category' };
        }

        if (lower === 'edit status' || lower === 'status') {
          return { nextNodeId: 'edit_status' };
        }

        if (lower === 'move to another category' || lower === 'move category') {
          return { nextNodeId: 'move_category' };
        }

        return null;
      },
    };
  }

  private createEditNameNode(): NodeHandler {
    return {
      messages: () => {
        const service = this.getCurrentService();
        if (!service) return [{ role: 'printy', text: 'Service not found.' }];
        return [
          {
            role: 'printy',
            text: `Current name: ${service.name}. What should the new name be?`,
          },
        ];
      },
      quickReplies: () => ['End Chat'],
      handleInput: (input: string, state: FlowState) => {
        const service = this.getCurrentService();
        if (!service) {
          return {
            messages: [{ role: 'printy', text: 'Service not found.' }],
            quickReplies: ['End Chat'],
          };
        }

        const newName = input.trim();
        if (!newName) {
          return {
            messages: [
              {
                role: 'printy',
                text: 'Please provide a new name for the service.',
              },
            ],
            quickReplies: ['End Chat'],
          };
        }

        const oldName = service.name;
        this.updateService(
          service.id,
          { name: newName },
          state as PortfolioState
        );

        return {
          nextNodeId: 'action',
          messages: [
            createServiceUpdatedMessage(
              service.code || service.id,
              'name',
              oldName,
              newName
            ),
          ],
        };
      },
    };
  }

  private createEditCategoryNode(): NodeHandler {
    return {
      messages: () => {
        const service = this.getCurrentService();
        if (!service) return [{ role: 'printy', text: 'Service not found.' }];
        return [
          {
            role: 'printy',
            text: `Current category: ${service.category}. What should the new category be?`,
          },
        ];
      },
      quickReplies: () => ['End Chat'],
      handleInput: (input: string, state: FlowState) => {
        const service = this.getCurrentService();
        if (!service) {
          return {
            messages: [{ role: 'printy', text: 'Service not found.' }],
            quickReplies: ['End Chat'],
          };
        }

        const newCategory = input.trim();
        if (!newCategory) {
          return {
            messages: [
              {
                role: 'printy',
                text: 'Please provide a new category for the service.',
              },
            ],
            quickReplies: ['End Chat'],
          };
        }

        const oldCategory = service.category;
        this.updateService(
          service.id,
          { category: newCategory },
          state as PortfolioState
        );

        return {
          nextNodeId: 'action',
          messages: [
            createServiceUpdatedMessage(
              service.code || service.id,
              'category',
              oldCategory,
              newCategory
            ),
          ],
        };
      },
    };
  }

  private createEditStatusNode(): NodeHandler {
    return {
      messages: () => {
        const service = this.getCurrentService();
        if (!service) return [{ role: 'printy', text: 'Service not found.' }];
        return [
          {
            role: 'printy',
            text: `Current status: ${service.status}. What should the new status be?`,
          },
        ];
      },
      quickReplies: () => [...SERVICE_STATUS_OPTIONS, 'End Chat'],
      handleInput: (input: string, state: FlowState) => {
        const service = this.getCurrentService();
        if (!service) {
          return {
            messages: [{ role: 'printy', text: 'Service not found.' }],
            quickReplies: ['End Chat'],
          };
        }

        const newStatus = normalizeServiceStatus(input);
        if (!newStatus) {
          return {
            messages: [
              {
                role: 'printy',
                text: `Valid statuses: ${SERVICE_STATUS_OPTIONS.join(', ')}`,
              },
            ],
            quickReplies: [...SERVICE_STATUS_OPTIONS, 'End Chat'],
          };
        }

        const oldStatus = service.status;
        this.updateService(
          service.id,
          { status: newStatus },
          state as PortfolioState
        );

        return {
          nextNodeId: 'action',
          messages: [
            createServiceUpdatedMessage(
              service.code || service.id,
              'status',
              oldStatus,
              newStatus
            ),
          ],
        };
      },
    };
  }

  private createMoveCategoryNode(): NodeHandler {
    return {
      messages: () => {
        const service = this.getCurrentService();
        if (!service) return [{ role: 'printy', text: 'Service not found.' }];
        const categories = this.getExistingCategories();
        const otherCategories = categories.filter(
          cat => cat !== service.category
        );
        return [
          {
            role: 'printy',
            text: `Moving ${service.name} from "${service.category}" to another category.`,
          },
          {
            role: 'printy',
            text: `Available categories: ${otherCategories.join(', ')}`,
          },
        ];
      },
      quickReplies: () => {
        const service = this.getCurrentService();
        if (!service) return ['End Chat'];
        const categories = this.getExistingCategories();
        const otherCategories = categories.filter(
          cat => cat !== service.category
        );
        return [...otherCategories, 'End Chat'];
      },
      handleInput: (input: string, state: FlowState) => {
        const service = this.getCurrentService();
        if (!service) {
          return {
            messages: [{ role: 'printy', text: 'Service not found.' }],
            quickReplies: ['End Chat'],
          };
        }

        const categories = this.getExistingCategories();
        const otherCategories = categories.filter(
          cat => cat !== service.category
        );
        const selectedCategory = otherCategories.find(
          cat =>
            cat.toLowerCase() === input.toLowerCase() ||
            cat.toLowerCase().includes(input.toLowerCase()) ||
            input.toLowerCase().includes(cat.toLowerCase())
        );

        if (!selectedCategory) {
          return {
            messages: [
              {
                role: 'printy',
                text: `Please select a valid category: ${otherCategories.join(', ')}`,
              },
            ],
            quickReplies: [...otherCategories, 'End Chat'],
          };
        }

        const oldCategory = service.category;
        this.updateService(
          service.id,
          { category: selectedCategory },
          state as PortfolioState
        );

        return {
          nextNodeId: 'action',
          messages: [
            {
              role: 'printy',
              text: `✅ Moved ${service.name} from "${oldCategory}" to "${selectedCategory}"`,
            },
          ],
        };
      },
    };
  }

  private createChooseCategoryNode(): NodeHandler {
    return {
      messages: () => {
        const service = this.getCurrentService();
        if (!service) return [{ role: 'printy', text: 'Service not found.' }];
        return [
          {
            role: 'printy',
            text: `Which category should ${service.name} be moved to?`,
          },
        ];
      },
      quickReplies: () => {
        const service = this.getCurrentService();
        if (!service) return ['End Chat'];
        const categories = this.getExistingCategories();
        const otherCategories = categories.filter(
          cat => cat !== service.category
        );
        return [...otherCategories, 'End Chat'];
      },
      handleInput: (input: string, state: FlowState) => {
        return this.createMoveCategoryNode().handleInput!(
          input,
          state,
          this.context
        );
      },
    };
  }

  private createAddServiceNode(): NodeHandler {
    return {
      messages: () => [
        {
          role: 'printy',
          text: 'To add a new service, provide: Name=Service Name; Code=SRV-XXX; Category=Category Name',
        },
      ],
      quickReplies: () => ['End Chat'],
      handleInput: (input: string) => {
        const addMatch = /name=(.+?);\s*code=(.+?);\s*category=(.+)$/i.exec(
          input
        );
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
          quickReplies: ['End Chat'],
        };
      },
    };
  }

  private createDoneNode(): NodeHandler {
    return {
      messages: () => [{ role: 'printy', text: 'Done. Anything else?' }],
      quickReplies: () => ['Edit Service', 'End Chat'],
    };
  }

  private updateService(
    serviceId: string,
    updates: Partial<any>,
    state: PortfolioState
  ): void {
    // Update via context if available
    if (this.context.updateService) {
      this.context.updateService(serviceId, updates);
    }

    // Update mock data
    const mi = mockServices.findIndex(s => s.id === serviceId);
    if (mi !== -1) {
      mockServices[mi] = { ...mockServices[mi], ...updates };
    }

    // Update local state
    state.currentServices = state.currentServices.map(s =>
      s.id === serviceId ? { ...s, ...updates } : s
    );

    // Refresh if available
    if (this.context.refreshServices) {
      this.context.refreshServices();
    }
  }
}

export const portfolioFlow = new PortfolioFlow();
