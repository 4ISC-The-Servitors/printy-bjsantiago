/**
 * Console Filter Test
 *
 * This file demonstrates the console filtering functionality.
 * Run this in the browser console to test the filtering.
 */

export function testConsoleFiltering() {
  console.log('=== Console Filtering Test ===');

  // These should be filtered out (verbose logs)
  console.log('File upload triggered:', { files: ['test.jpg'] });
  console.log('Is payment flow:', true);
  console.log('Flow definition loaded:', { flowId: 'test-flow' });
  console.log('Loaded tickets data:', [{ id: 1, status: 'open' }]);
  console.log('Fetched orders:', [{ id: 1, total: 100 }]);
  console.log('ProcessInput] Current node options:', ['option1', 'option2']);
  console.log('useAdminChat opening with topic:', 'orders');
  console.log('Order status:', 'pending');

  // These should be shown (critical errors)
  console.error(
    'Error loading tickets:',
    new Error('Database connection failed')
  );
  console.error('Failed to fetch orders:', new Error('Network timeout'));
  console.error('Error saving quote:', new Error('Validation failed'));
  console.error('Failed to process payment:', new Error('Invalid card'));
  console.error('Database error:', new Error('Connection lost'));
  console.error('Authentication failed:', new Error('Invalid token'));

  // These should be shown (warnings)
  console.warn('Warning: Session will expire in 5 minutes');
  console.warn('Deprecated API endpoint used');

  // These should be filtered out (info/debug)
  console.info('User logged in successfully');
  console.debug('Cache hit for flow definition');

  console.log('=== Test Complete ===');
  console.log(
    'Check your terminal - you should only see errors and warnings above'
  );
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testConsoleFiltering = testConsoleFiltering;
}
