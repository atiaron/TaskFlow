/**
 * Utility functions for drag and drop operations
 * Compatible with touch and mouse events
 */

// Get client coordinates from event (works with touch and mouse)
export const getClientCoords = (event) => {
  if (event.touches && event.touches[0]) {
    return {
      clientX: event.touches[0].clientX,
      clientY: event.touches[0].clientY
    };
  }
  
  return {
    clientX: event.clientX,
    clientY: event.clientY
  };
};

// Calculate distance between two points
export const getDistance = (pointA, pointB) => {
  const dx = pointA.clientX - pointB.clientX;
  const dy = pointA.clientY - pointB.clientY;
  return Math.sqrt(dx * dx + dy * dy);
};

// Debounce function to limit function calls
export const debounce = (func, wait) => {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
};

// Find the closest element in a list based on Y coordinate
export const findClosestElement = (elements, yPosition) => {
  if (!elements || elements.length === 0) return null;
  
  let closestElement = null;
  let closestDistance = Infinity;
  
  elements.forEach(el => {
    const rect = el.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const distance = Math.abs(centerY - yPosition);
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestElement = el;
    }
  });
  
  return closestElement;
};

// Get element index among siblings
export const getElementIndex = (element) => {
  if (!element || !element.parentNode) return -1;
  
  const siblings = Array.from(element.parentNode.children);
  return siblings.indexOf(element);
};