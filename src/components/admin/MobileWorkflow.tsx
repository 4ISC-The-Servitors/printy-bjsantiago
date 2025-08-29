import React, { useState } from 'react';
import { Text, Badge, Button, Card } from '../shared';
import { Smartphone, Zap, Clock } from 'lucide-react';

export interface WorkflowAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  shortcut: string;
  gesture: 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'double-tap' | 'long-press';
  category: 'orders' | 'tickets' | 'services' | 'quick';
  priority: 'low' | 'medium' | 'high';
  estimatedTime: string;
}

interface MobileWorkflowProps {
  actions: WorkflowAction[];
  onExecuteAction: (action: WorkflowAction) => void;
  onCustomizeShortcuts: () => void;
}

const MobileWorkflow: React.FC<MobileWorkflowProps> = ({
  actions,
  onExecuteAction,
  onCustomizeShortcuts,
}) => {
  const [activeGesture] = useState<string | null>(null);
  const [recentActions] = useState<WorkflowAction[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);

  // Group actions by category
  const groupedActions = actions.reduce((groups, action) => {
    if (!groups[action.category]) {
      groups[action.category] = [];
    }
    groups[action.category].push(action);
    return groups;
  }, {} as Record<string, WorkflowAction[]>);



  const getGestureIcon = (gesture: WorkflowAction['gesture']) => {
    switch (gesture) {
      case 'swipe-left':
        return <span className="w-4 h-4 text-center">←</span>;
      case 'swipe-right':
        return <span className="w-4 h-4 text-center">→</span>;
      case 'swipe-up':
        return <span className="w-4 h-4 text-center">↑</span>;
      case 'swipe-down':
        return <span className="w-4 h-4 text-center">↓</span>;
      case 'double-tap':
        return <span className="w-4 h-4 text-center">⚡</span>;
      case 'long-press':
        return <span className="w-4 h-4 text-center">⏱</span>;
      default:
        return <span className="w-4 h-4 text-center">👆</span>;
    }
  };

  const getPriorityColor = (priority: WorkflowAction['priority']) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const getCategoryColor = (category: WorkflowAction['category']) => {
    switch (category) {
      case 'orders':
        return 'primary';
      case 'tickets':
        return 'warning';
      case 'services':
        return 'success';
      case 'quick':
        return 'accent';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="w-6 h-6 text-brand-primary" />
          <Text variant="h2" size="2xl" weight="semibold">Mobile Workflow</Text>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTutorial(!showTutorial)}
          >
            Tutorial
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onCustomizeShortcuts}
          >
            Customize
          </Button>
        </div>
      </div>

      {/* Gesture Tutorial */}
      {showTutorial && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['swipe-left', 'swipe-right', 'swipe-up', 'swipe-down'] as const).map(gesture => (
              <div key={gesture} className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 bg-white rounded-lg border-2 border-blue-300 flex items-center justify-center">
                  {getGestureIcon(gesture)}
                </div>
                <Text variant="p" size="sm" weight="medium" className="capitalize">
                  {gesture.replace('-', ' ')}
                </Text>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Text variant="p" size="sm" color="muted">
              Use these gestures on mobile devices for quick actions
            </Text>
          </div>
        </Card>
      )}

      {/* Active Gesture Indicator */}
      {activeGesture && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-brand-primary rounded-full flex items-center justify-center">
              {getGestureIcon(activeGesture as WorkflowAction['gesture'])}
            </div>
            <Text variant="h3" size="lg" weight="semibold" className="capitalize">
              {activeGesture.replace('-', ' ')}
            </Text>
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions
          .filter(action => action.category === 'quick')
          .slice(0, 8)
          .map(action => (
            <button
              key={action.id}
              onClick={() => onExecuteAction(action)}
              className="p-4 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-center group"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-brand-primary-50 rounded-lg flex items-center justify-center group-hover:bg-brand-primary-100 transition-colors">
                <span className="text-2xl">{action.icon}</span>
              </div>
              <Text variant="p" size="sm" weight="medium" className="mb-1">
                {action.title}
              </Text>
              <Text variant="p" size="xs" color="muted" className="mb-2">
                {action.description}
              </Text>
              <div className="flex items-center justify-center gap-2">
                <Badge variant={getPriorityColor(action.priority)} size="sm">
                  {action.priority}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-neutral-500">
                  <Clock className="w-3 h-3" />
                  {action.estimatedTime}
                </div>
              </div>
            </button>
          ))}
      </div>

      {/* Category-based Actions */}
      {Object.entries(groupedActions).map(([category, categoryActions]) => {
        if (category === 'quick') return null;
        
        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={getCategoryColor(category as WorkflowAction['category'])} size="sm">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Badge>
              <Text variant="h3" size="lg" weight="semibold">
                {category.charAt(0).toUpperCase() + category.slice(1)} Actions
              </Text>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryActions.map(action => (
                <Card key={action.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-brand-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">{action.icon}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Text variant="p" size="sm" weight="medium" className="truncate">
                          {action.title}
                        </Text>
                        <Badge variant={getPriorityColor(action.priority)} size="sm">
                          {action.priority}
                        </Badge>
                      </div>
                      
                      <Text variant="p" size="xs" color="muted" className="mb-2">
                        {action.description}
                      </Text>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-xs text-neutral-500">
                            {getGestureIcon(action.gesture)}
                            <span className="capitalize">
                              {action.gesture.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-neutral-500">
                            <Clock className="w-3 h-3" />
                            {action.estimatedTime}
                          </div>
                        </div>
                        
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => onExecuteAction(action)}
                        >
                          Execute
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Recent Actions */}
      {recentActions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-primary" />
            <Text variant="h3" size="lg" weight="semibold">Recent Actions</Text>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentActions.map(action => (
              <Card key={action.id} className="p-4 bg-neutral-50 border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm">{action.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text variant="p" size="sm" weight="medium" className="truncate">
                      {action.title}
                    </Text>
                    <Text variant="p" size="xs" color="muted">
                      {action.shortcut}
                    </Text>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Tips */}
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-start gap-3">
          <Smartphone className="w-6 h-6 text-green-600 mt-1" />
          <div>
            <Text variant="h4" size="lg" weight="semibold" className="text-green-800 mb-2">
              Mobile Tips
            </Text>
            <ul className="space-y-2 text-sm text-green-700">
              <li>• Use swipe gestures for quick navigation between sections</li>
              <li>• Double-tap to mark items as read or complete</li>
              <li>• Long-press for context menus and additional options</li>
              <li>• Customize shortcuts for your most common tasks</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MobileWorkflow;
