// Refactored MultiplePortfolio Flow using shared utilities and base framework

// BACKEND_TODO: Remove mockServices import; rely solely on context-provided services from Supabase.
import { mockServices } from '../../../data/services'; // DELETE when backend is wired
import {
  FlowBase,
  SERVICE_STATUS_OPTIONS,
  createServiceUpdatedMessage,
  createSelectionListMessage,
} from '../shared';
import { normalizeServiceStatus } from '../shared/utils/StatusNormalizers';
import type { FlowState, FlowContext, NodeHandler } from '../shared';
import { extractServiceCodes } from '../shared/utils/IdExtractors';

type MultiplePortfolioNodeId =
  | 'multi_start'
  | 'action'
  | 'choose_service'
  | 'edit_service'
  | 'edit_name'
  | 'edit_category'
  | 'edit_status'
  | 'move_category'
  | 'choose_category'
  | 'done';

interface MultiplePortfolioState extends FlowState {
  currentNodeId: MultiplePortfolioNodeId;
  selectedServiceIds: string[];
  servicesRef: any[];
  currentServiceId: string | null;
  processedIds: Set<string>;
}

class MultiplePortfolioFlow extends FlowBase {
  id = 'admin-multiple-portfolio';
  title = 'Admin Multiple Portfolio';

  constructor() {
    super({
      currentNodeId: 'multi_start',
      selectedServiceIds: [],
      servicesRef: [],
      currentServiceId: null,
      processedIds: new Set(),
    });
    this.registerNodes();
  }

  protected initializeState(context: FlowContext): void {
    this.state.selectedServiceIds = Array.isArray(context?.serviceIds)
      ? (context?.serviceIds as string[]).map(x => x.toUpperCase())
      : [];
    this.state.servicesRef = (context?.services as any[]) || mockServices;
    this.state.processedIds = new Set<string>();
    this.state.currentServiceId = null;
    this.state.currentNodeId =
      this.state.selectedServiceIds.length > 1 ? 'multi_start' : 'action';
  }

  private registerNodes(): void {
    // Multi start node
    this.registerNode('multi_start', this.createMultiStartNode());

    // Action node
    this.registerNode('action', this.createActionNode());

    // Choose service node
    this.registerNode('choose_service', this.createChooseServiceNode());

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

    // Done node
    this.registerNode('done', this.createDoneNode());
  }

  private findService(idOrCode: string): any {
    const id = (idOrCode || '').toUpperCase();
    const serviceState = this.state as MultiplePortfolioState;

    const foundInRef = serviceState.servicesRef.find(
      (s: any) =>
        (s.id || '').toUpperCase() === id || (s.code || '').toUpperCase() === id
    );

    const foundInMock = mockServices.find(
      (s: any) =>
        (s.id || '').toUpperCase() === id || (s.code || '').toUpperCase() === id
    );

    return foundInRef || foundInMock;
  }

  private getExistingCategories(): string[] {
    const categories = new Set<string>();
    const serviceState = this.state as MultiplePortfolioState;
    serviceState.servicesRef.forEach((service: any) => {
      if (service.category) {
        categories.add(service.category);
      }
    });
    return Array.from(categories).sort();
  }

  private getCurrentService(): any {
    const serviceState = this.state as MultiplePortfolioState;
    if (!serviceState.currentServiceId) return null;
    return this.findService(serviceState.currentServiceId);
  }

  private getSelectedServices(): any[] {
    const serviceState = this.state as MultiplePortfolioState;
    return serviceState.selectedServiceIds
      .map(id => this.findService(id))
      .filter(Boolean);
  }

  private getRemainingServices(): any[] {
    const serviceState = this.state as MultiplePortfolioState;
    return serviceState.selectedServiceIds
      .filter(id => !serviceState.processedIds.has(id))
      .map(id => this.findService(id))
      .filter(Boolean);
  }

  private createMultiStartNode(): NodeHandler {
    return {
      messages: () => {
        const selected = this.getSelectedServices();
        const msgs: any[] = [
          {
            role: 'printy',
            text: `Multiple services assistant ready (${selected.length} selected).`,
          },
          { role: 'printy', text: 'You selected:' },
        ];
        msgs.push(...createSelectionListMessage(selected, 'service'));
        msgs.push({
          role: 'printy',
          text: 'What do you want to do with these services?',
        });
        return msgs;
      },
      quickReplies: () => ['Edit Service', 'End Chat'],
      handleInput: (input: string) => {
        const lower = input.toLowerCase();

        if (lower === 'edit service' || lower === 'edit') {
          return { nextNodeId: 'choose_service' };
        }

        return null;
      },
    };
  }

  private createActionNode(): NodeHandler {
    return {
      messages: () => {
        const serviceState = this.state as MultiplePortfolioState;
        return [
          {
            role: 'printy',
            text: `You selected ${serviceState.selectedServiceIds.length} services. What do you want to do with these services?`,
          },
        ];
      },
      quickReplies: () => ['Edit Service', 'End Chat'],
      handleInput: (input: string) => {
        const lower = input.toLowerCase();

        if (lower === 'edit service' || lower === 'edit') {
          return { nextNodeId: 'choose_service' };
        }

        return null;
      },
    };
  }

  private createChooseServiceNode(): NodeHandler {
    return {
      messages: () => {
        const remaining = this.getRemainingServices();
        return [
          {
            role: 'printy',
            text: `Which service would you like to work on first? (${remaining.length} remaining)`,
          },
        ];
      },
      quickReplies: () => {
        const remaining = this.getRemainingServices();
        return remaining
          .map((s: any) => `${s.code} - ${s.name}`)
          .concat(['End Chat']);
      },
      handleInput: (input: string) => {
        const remaining = this.getRemainingServices();
        const codes = extractServiceCodes(input);
        const serviceCode =
          codes[0] ||
          remaining.find(
            (s: any) =>
              s.code.toLowerCase() === input.toLowerCase() ||
              s.name.toLowerCase().includes(input.toLowerCase())
          )?.code;

        if (
          !serviceCode ||
          !remaining.find((s: any) => s.code === serviceCode)
        ) {
          return {
            messages: [
              {
                role: 'printy',
                text: 'Please pick one of the selected services.',
              },
            ],
            quickReplies: remaining
              .map((s: any) => `${s.code} - ${s.name}`)
              .concat(['End Chat']),
          };
        }

        return {
          nextNodeId: 'edit_service',
          stateUpdates: { currentServiceId: serviceCode },
        };
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
            text: `Working on ${service.name} (${service.code}). Current status: ${service.status}, Category: ${service.category}. What would you like to edit?`,
          },
        ];
      },
      quickReplies: () => [
        'Edit Name',
        'Edit Category',
        'Edit Status',
        'Move Category',
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

        if (lower === 'move category' || lower === 'move') {
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
          state as MultiplePortfolioState
        );

        const serviceState = state as MultiplePortfolioState;
        const processedIds = new Set(serviceState.processedIds);
        processedIds.add(serviceState.currentServiceId!);

        const remaining = this.getRemainingServices();
        const msgs = [
          createServiceUpdatedMessage(
            service.code || service.id,
            'name',
            oldName,
            newName
          ),
        ];

        if (remaining.length > 1) {
          return {
            nextNodeId: 'choose_service',
            stateUpdates: { processedIds, currentServiceId: null },
            messages: [
              ...msgs,
              {
                role: 'printy',
                text: `Next service to work on? (${remaining.length} remaining)`,
              },
            ],
          };
        }

        if (remaining.length === 1) {
          return {
            nextNodeId: 'edit_service',
            stateUpdates: { processedIds, currentServiceId: remaining[0].code },
            messages: msgs,
          };
        }

        return {
          nextNodeId: 'done',
          stateUpdates: { processedIds, currentServiceId: null },
          messages: msgs,
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
          state as MultiplePortfolioState
        );

        const serviceState = state as MultiplePortfolioState;
        const processedIds = new Set(serviceState.processedIds);
        processedIds.add(serviceState.currentServiceId!);

        const remaining = this.getRemainingServices();
        const msgs = [
          createServiceUpdatedMessage(
            service.code || service.id,
            'category',
            oldCategory,
            newCategory
          ),
        ];

        if (remaining.length > 1) {
          return {
            nextNodeId: 'choose_service',
            stateUpdates: { processedIds, currentServiceId: null },
            messages: [
              ...msgs,
              {
                role: 'printy',
                text: `Next service to work on? (${remaining.length} remaining)`,
              },
            ],
          };
        }

        if (remaining.length === 1) {
          return {
            nextNodeId: 'edit_service',
            stateUpdates: { processedIds, currentServiceId: remaining[0].code },
            messages: msgs,
          };
        }

        return {
          nextNodeId: 'done',
          stateUpdates: { processedIds, currentServiceId: null },
          messages: msgs,
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
          state as MultiplePortfolioState
        );

        const serviceState = state as MultiplePortfolioState;
        const processedIds = new Set(serviceState.processedIds);
        processedIds.add(serviceState.currentServiceId!);

        const remaining = this.getRemainingServices();
        const msgs = [
          createServiceUpdatedMessage(
            service.code || service.id,
            'status',
            oldStatus,
            newStatus
          ),
        ];

        if (remaining.length > 1) {
          return {
            nextNodeId: 'choose_service',
            stateUpdates: { processedIds, currentServiceId: null },
            messages: [
              ...msgs,
              {
                role: 'printy',
                text: `Next service to work on? (${remaining.length} remaining)`,
              },
            ],
          };
        }

        if (remaining.length === 1) {
          return {
            nextNodeId: 'edit_service',
            stateUpdates: { processedIds, currentServiceId: remaining[0].code },
            messages: msgs,
          };
        }

        return {
          nextNodeId: 'done',
          stateUpdates: { processedIds, currentServiceId: null },
          messages: msgs,
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
          state as MultiplePortfolioState
        );

        const serviceState = state as MultiplePortfolioState;
        const processedIds = new Set(serviceState.processedIds);
        processedIds.add(serviceState.currentServiceId!);

        const remaining = this.getRemainingServices();
        const msgs: any[] = [
          {
            role: 'printy',
            text: `✅ Moved ${service.name} from "${oldCategory}" to "${selectedCategory}"`,
          },
        ];

        if (remaining.length > 1) {
          return {
            nextNodeId: 'choose_service',
            stateUpdates: { processedIds, currentServiceId: null },
            messages: [
              ...msgs,
              {
                role: 'printy',
                text: `Next service to work on? (${remaining.length} remaining)`,
              },
            ],
          };
        }

        if (remaining.length === 1) {
          return {
            nextNodeId: 'edit_service',
            stateUpdates: { processedIds, currentServiceId: remaining[0].code },
            messages: msgs,
          };
        }

        return {
          nextNodeId: 'done',
          stateUpdates: { processedIds, currentServiceId: null },
          messages: msgs,
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

  private createDoneNode(): NodeHandler {
    return {
      messages: () => [
        {
          role: 'printy',
          text: 'All selected services have been processed. Anything else?',
        },
      ],
      quickReplies: () => ['Edit Service', 'End Chat'],
    };
  }

  private updateService(
    serviceId: string,
    updates: Partial<any>,
    state: MultiplePortfolioState
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
    state.servicesRef = state.servicesRef.map(s =>
      s.id === serviceId ? { ...s, ...updates } : s
    );

    // Refresh if available
    if (this.context.refreshServices) {
      this.context.refreshServices();
    }
  }
}

export const multiplePortfolioFlow = new MultiplePortfolioFlow();
