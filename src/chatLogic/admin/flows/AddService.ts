// Add Service Flow for creating new services in the portfolio

import { mockServices } from '../../../data/services';
import {
  FlowBase,
  SERVICE_STATUS_OPTIONS,
  createServiceUpdatedMessage,
} from '../shared';
import { normalizeServiceStatus } from '../shared/utils/StatusNormalizers';
import type { FlowState, FlowContext, NodeHandler } from '../shared';

type AddServiceNodeId =
  | 'start'
  | 'enter_name'
  | 'enter_code'
  | 'choose_category'
  | 'choose_status'
  | 'confirm'
  | 'done';

interface AddServiceState extends FlowState {
  currentNodeId: AddServiceNodeId;
  newService: {
    name?: string;
    code?: string;
    category?: string;
    status?: 'Active' | 'Inactive' | 'Retired';
  };
  servicesRef: any[];
  existingCategories: string[];
}

class AddServiceFlow extends FlowBase {
  id = 'admin-add-service';
  title = 'Admin Add Service';

  constructor() {
    super({
      currentNodeId: 'start',
      newService: {},
      servicesRef: [],
      existingCategories: [],
    });
    this.registerNodes();
  }

  protected initializeState(context: FlowContext): void {
    this.state.servicesRef = (context?.services as any[]) || mockServices;
    this.state.existingCategories = this.getExistingCategories();
    this.state.newService = {};
    this.state.currentNodeId = 'start';
  }

  private registerNodes(): void {
    // Start node
    this.registerNode('start', this.createStartNode());

    // Enter name node
    this.registerNode('enter_name', this.createEnterNameNode());

    // Enter code node
    this.registerNode('enter_code', this.createEnterCodeNode());

    // Choose category node
    this.registerNode('choose_category', this.createChooseCategoryNode());

    // Choose status node
    this.registerNode('choose_status', this.createChooseStatusNode());

    // Confirm node
    this.registerNode('confirm', this.createConfirmNode());

    // Done node
    this.registerNode('done', this.createDoneNode());
  }

  private getExistingCategories(): string[] {
    const categories = new Set<string>();
    this.state.servicesRef.forEach((service: any) => {
      if (service.category) {
        categories.add(service.category);
      }
    });
    return Array.from(categories).sort();
  }

  private createStartNode(): NodeHandler {
    return {
      messages: () => [
        {
          role: 'printy',
          text: 'Welcome! I\'ll help you add a new service to the portfolio. Let\'s start with the service name.',
        },
        {
          role: 'printy',
          text: 'What would you like to name this service?',
        },
      ],
      quickReplies: () => ['End Chat'],
      handleInput: (input: string) => {
        const name = input.trim();
        if (!name) {
          return {
            messages: [
              {
                role: 'printy',
                text: 'Please provide a service name.',
              },
            ],
            quickReplies: ['End Chat'],
          };
        }

        return {
          nextNodeId: 'enter_code',
          stateUpdates: {
            newService: { ...this.state.newService, name },
          },
        };
      },
    };
  }

  private createEnterNameNode(): NodeHandler {
    return {
      messages: () => [
        {
          role: 'printy',
          text: 'What would you like to name this service?',
        },
      ],
      quickReplies: () => ['End Chat'],
      handleInput: (input: string) => {
        const name = input.trim();
        if (!name) {
          return {
            messages: [
              {
                role: 'printy',
                text: 'Please provide a service name.',
              },
            ],
            quickReplies: ['End Chat'],
          };
        }

        return {
          nextNodeId: 'enter_code',
          stateUpdates: {
            newService: { ...this.state.newService, name },
          },
        };
      },
    };
  }

  private createEnterCodeNode(): NodeHandler {
    return {
      messages: () => {
        const serviceState = this.state as AddServiceState;
        return [
          {
            role: 'printy',
            text: `Great! Service name: "${serviceState.newService.name}". Now let's set the service code.`,
          },
          {
            role: 'printy',
            text: 'Enter a service code (e.g., SRV-XXX):',
          },
        ];
      },
      quickReplies: () => ['End Chat'],
      handleInput: (input: string) => {
        const code = input.trim().toUpperCase();
        if (!code) {
          return {
            messages: [
              {
                role: 'printy',
                text: 'Please provide a service code.',
              },
            ],
            quickReplies: ['End Chat'],
          };
        }

        // Check if code already exists
        const serviceState = this.state as AddServiceState;
        const existingService = serviceState.servicesRef.find(
          (s: any) => s.code === code
        );
        if (existingService) {
          return {
            messages: [
              {
                role: 'printy',
                text: `Service code "${code}" already exists. Please choose a different code.`,
              },
            ],
            quickReplies: ['End Chat'],
          };
        }

        return {
          nextNodeId: 'choose_category',
          stateUpdates: {
            newService: { ...serviceState.newService, code },
          },
        };
      },
    };
  }

  private createChooseCategoryNode(): NodeHandler {
    return {
      messages: () => {
        const serviceState = this.state as AddServiceState;
        return [
          {
            role: 'printy',
            text: `Perfect! Service code: "${serviceState.newService.code}". Now let's choose a category.`,
          },
          {
            role: 'printy',
            text: `Available categories: ${serviceState.existingCategories.join(', ')}`,
          },
          {
            role: 'printy',
            text: 'Which category should this service belong to? (You can also type a new category name)',
          },
        ];
      },
      quickReplies: (state) => {
        const serviceState = state as AddServiceState;
        return [...serviceState.existingCategories, 'End Chat'];
      },
      handleInput: (input: string) => {
        const category = input.trim();
        if (!category) {
          return {
            messages: [
              {
                role: 'printy',
                text: 'Please provide a category.',
              },
            ],
            quickReplies: ['End Chat'],
          };
        }

        return {
          nextNodeId: 'choose_status',
          stateUpdates: {
            newService: { ...this.state.newService, category },
          },
        };
      },
    };
  }

  private createChooseStatusNode(): NodeHandler {
    return {
      messages: () => {
        const serviceState = this.state as AddServiceState;
        return [
          {
            role: 'printy',
            text: `Excellent! Category: "${serviceState.newService.category}". Now let's set the initial status.`,
          },
          {
            role: 'printy',
            text: 'What should be the initial status of this service?',
          },
        ];
      },
      quickReplies: () => [...SERVICE_STATUS_OPTIONS, 'End Chat'],
      handleInput: (input: string) => {
        const serviceState = this.state as AddServiceState;
        const status = normalizeServiceStatus(input);
        if (!status) {
          return {
            messages: [
              {
                role: 'printy',
                text: `Please choose a valid status: ${SERVICE_STATUS_OPTIONS.join(', ')}`,
              },
            ],
            quickReplies: [...SERVICE_STATUS_OPTIONS, 'End Chat'],
          };
        }

        return {
          nextNodeId: 'confirm',
          stateUpdates: {
            newService: { ...serviceState.newService, status },
          },
        };
      },
    };
  }

  private createConfirmNode(): NodeHandler {
    return {
      messages: () => {
        const serviceState = this.state as AddServiceState;
        const { newService } = serviceState;
        return [
          {
            role: 'printy',
            text: 'Please review the new service details:',
          },
          {
            role: 'printy',
            text: `📝 Name: ${newService.name}`,
          },
          {
            role: 'printy',
            text: `🏷️ Code: ${newService.code}`,
          },
          {
            role: 'printy',
            text: `📂 Category: ${newService.category}`,
          },
          {
            role: 'printy',
            text: `📊 Status: ${newService.status}`,
          },
          {
            role: 'printy',
            text: 'Does this look correct?',
          },
        ];
      },
      quickReplies: () => ['Yes, Create Service', 'No, Start Over', 'End Chat'],
      handleInput: (input: string) => {
        const lower = input.toLowerCase();
        if (lower.includes('yes') || lower.includes('create')) {
          return { nextNodeId: 'done' };
        }
        if (lower.includes('no') || lower.includes('start over')) {
          return {
            nextNodeId: 'start',
            stateUpdates: { newService: {} },
          };
        }
        return null;
      },
    };
  }

  private createDoneNode(): NodeHandler {
    return {
      messages: () => {
        const serviceState = this.state as AddServiceState;
        const { newService } = serviceState;
        
        // Create the new service
        const newServiceId = `SRV-${Date.now().toString().slice(-3)}`;
        const createdService = {
          id: newServiceId,
          name: newService.name!,
          code: newService.code!,
          category: newService.category!,
          status: newService.status!,
        };

        // Add to mock data
        mockServices.push(createdService);

        // Update via context if available
        if (this.context.updateService) {
          this.context.updateService(newServiceId, createdService);
        }

        // Refresh if available
        if (this.context.refreshServices) {
          this.context.refreshServices();
        }

        return [
          {
            role: 'printy',
            text: '✅ Service created successfully!',
          },
          {
            role: 'printy',
            text: `New service "${newService.name}" (${newService.code}) has been added to the "${newService.category}" category with status "${newService.status}".`,
          },
          {
            role: 'printy',
            text: 'The service is now available in your portfolio. Would you like to add another service?',
          },
        ];
      },
      quickReplies: () => ['Add Another Service', 'End Chat'],
      handleInput: (input: string) => {
        const lower = input.toLowerCase();
        if (lower.includes('another') || lower.includes('add')) {
          return {
            nextNodeId: 'start',
            stateUpdates: { newService: {} },
          };
        }
        return null;
      },
    };
  }
}

export const addServiceFlow = new AddServiceFlow();
