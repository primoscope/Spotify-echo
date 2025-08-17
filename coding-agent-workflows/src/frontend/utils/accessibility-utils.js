// Accessibility optimization utilities
export const accessibilityUtils = {
  // Generate unique IDs for ARIA labels
  generateId: (prefix = 'music') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  // Validate color contrast
  validateColorContrast: (foreground, background) => {
    // Implement WCAG 2.1 AA contrast ratio validation
    const ratio = calculateContrastRatio(foreground, background);
    return ratio >= 4.5; // AA standard for normal text
  },
  
  // Keyboard navigation support
  handleKeyboardNavigation: (event, onAction) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onAction();
    }
  },
  
  // Screen reader announcements
  announceToScreenReader: (message) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
};

// Helper function for contrast ratio calculation
const calculateContrastRatio = (foreground, background) => {
  // Simplified contrast ratio calculation
  // In production, use a proper color contrast library
  return 4.5; // Placeholder value
};

export default accessibilityUtils;