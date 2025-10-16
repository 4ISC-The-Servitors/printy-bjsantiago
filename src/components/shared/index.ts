/**
 * @deprecated This file is deprecated. Import from @shared/components instead.
 *
 * Legacy re-exports for backward compatibility during migration.
 * All components have been moved to src/shared/components/
 *
 * Migration guide:
 * - Old: import { Button } from '../components/shared'
 * - New: import { Button } from '@shared/components/ui'
 * - Or:  import { Button } from '@shared/components'
 */

// Re-export all components from new locations
export * from '../../shared/components';

// Re-export toast hook
export { useToast } from '../../lib/useToast';
export type { ToastOptions, ToastMethods, ToastData } from '../../lib/useToast';

// Re-export showcase (if still needed - to be deprecated)
export { default as ComponentShowcase } from './showcase/ComponentShowcase';
