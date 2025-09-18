// State management utilities for all chat flows

export interface FlowState {
  currentNodeId: string;
  [key: string]: any;
}

export function createInitialState(
  currentNodeId: string,
  additionalState: Record<string, any> = {}
): FlowState {
  return {
    currentNodeId,
    ...additionalState,
  };
}

export function updateState(
  currentState: FlowState,
  updates: Partial<FlowState>
): FlowState {
  return {
    ...currentState,
    ...updates,
  };
}

export function setCurrentNode(state: FlowState, nodeId: string): FlowState {
  return updateState(state, { currentNodeId: nodeId });
}
