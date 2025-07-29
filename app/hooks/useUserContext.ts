import { useState, useCallback } from 'react';

export interface UserContext {
  location?: {
    floor?: number;
    buildingType?: string;
    isIndoor?: boolean;
  };
  status?: {
    isInjured?: boolean;
    isTrapped?: boolean;
    injuryType?: string;
  };
  companions?: {
    count?: number;
    hasChildren?: boolean;
    hasElderly?: boolean;
  };
  resources?: {
    hasWater?: boolean;
    hasFood?: boolean;
    hasPhone?: boolean;
    hasPower?: boolean;
  };
  timestamp?: Date;
}

export const useUserContext = () => {
  const [context, setContext] = useState<UserContext>({});

  // Extract context from user message
  const extractContext = useCallback((message: string): Partial<UserContext> => {
    const updates: Partial<UserContext> = {};
    const lowerMessage = message.toLowerCase();

    // Location extraction
    const floorMatch = message.match(/(\d+)(?:th|st|nd|rd)?\s*floor/i);
    if (floorMatch) {
      updates.location = { 
        ...context.location, 
        floor: parseInt(floorMatch[1]),
        isIndoor: true 
      };
    }

    if (lowerMessage.includes('basement')) {
      updates.location = { 
        ...context.location, 
        floor: -1,
        isIndoor: true 
      };
    }

    if (lowerMessage.includes('outdoor') || lowerMessage.includes('outside')) {
      updates.location = { ...context.location, isIndoor: false };
    }

    if (lowerMessage.includes('indoor') || lowerMessage.includes('inside')) {
      updates.location = { ...context.location, isIndoor: true };
    }

    // Building type
    if (lowerMessage.includes('office') || lowerMessage.includes('building')) {
      updates.location = { ...context.location, buildingType: 'office' };
    } else if (lowerMessage.includes('home') || lowerMessage.includes('house') || lowerMessage.includes('apartment')) {
      updates.location = { ...context.location, buildingType: 'residential' };
    }

    // Status extraction
    if (/injured|hurt|bleeding|pain|broken|wound/i.test(lowerMessage)) {
      updates.status = { ...context.status, isInjured: true };
      
      // Try to identify injury type
      if (lowerMessage.includes('bleeding')) {
        updates.status.injuryType = 'bleeding';
      } else if (lowerMessage.includes('broken')) {
        updates.status.injuryType = 'fracture';
      }
    }

    if (/trapped|stuck|can't move|buried|pinned|cannot move/i.test(lowerMessage)) {
      updates.status = { ...context.status, isTrapped: true };
    }

    if (/safe|fine|okay|not hurt|uninjured/i.test(lowerMessage)) {
      updates.status = { ...context.status, isInjured: false, isTrapped: false };
    }

    // Companions extraction
    if (/alone|by myself|solo/i.test(lowerMessage)) {
      updates.companions = { count: 0 };
    } else {
      // Check for specific numbers
      const peopleMatch = message.match(/with (\d+) (?:people|person|others)/i);
      if (peopleMatch) {
        updates.companions = { count: parseInt(peopleMatch[1]) };
      }
      
      // Check for family members
      if (lowerMessage.includes('family')) {
        updates.companions = { ...updates.companions, count: updates.companions?.count || 3 };
      }
      
      if (lowerMessage.includes('child') || lowerMessage.includes('kid')) {
        updates.companions = { ...updates.companions, hasChildren: true };
      }
      
      if (lowerMessage.includes('elder') || lowerMessage.includes('old')) {
        updates.companions = { ...updates.companions, hasElderly: true };
      }
    }

    // Resources extraction
    if (lowerMessage.includes('water')) {
      const hasWater = !lowerMessage.includes('no water') && !lowerMessage.includes("don't have water");
      updates.resources = { ...context.resources, hasWater };
    }

    if (lowerMessage.includes('food')) {
      const hasFood = !lowerMessage.includes('no food') && !lowerMessage.includes("don't have food");
      updates.resources = { ...context.resources, hasFood };
    }

    if (lowerMessage.includes('phone')) {
      const hasPhone = !lowerMessage.includes('no phone') && !lowerMessage.includes("phone is dead");
      updates.resources = { ...context.resources, hasPhone };
    }

    if (lowerMessage.includes('power') || lowerMessage.includes('electricity')) {
      const hasPower = !lowerMessage.includes('no power') && !lowerMessage.includes('power is out');
      updates.resources = { ...context.resources, hasPower };
    }

    return updates;
  }, [context]);

  // Update context with new information
  const updateContext = useCallback((message: string) => {
    console.log('=== USER CONTEXT EXTRACTION ===');
    console.log('User message:', message);
    
    const extracted = extractContext(message);
    
    if (Object.keys(extracted).length > 0) {
      console.log('Extracted context:', JSON.stringify(extracted, null, 2));
      
      setContext(prev => {
        const newContext = {
          ...prev,
          ...extracted,
          timestamp: new Date()
        };
        console.log('Updated full context:', JSON.stringify(newContext, null, 2));
        return newContext;
      });
    } else {
      console.log('No context extracted from this message');
    }
    console.log('===============================');
  }, [extractContext]);

  // Format context for AI prompt
  const formatContextForPrompt = useCallback((): string => {
    if (!context || Object.keys(context).length === 0) {
      console.log('No user context to format for prompt');
      return '';
    }

    console.log('=== FORMATTING CONTEXT FOR PROMPT ===');
    console.log('Current context state:', JSON.stringify(context, null, 2));

    let contextStr = '\n[Current User Situation]';
    
    // Location information
    if (context.location) {
      if (context.location.floor !== undefined) {
        contextStr += `\n- Location: ${context.location.floor > 0 ? `Floor ${context.location.floor}` : context.location.floor === 0 ? 'Ground floor' : 'Basement'}`;
      }
      if (context.location.buildingType) {
        contextStr += ` in ${context.location.buildingType} building`;
      }
      if (context.location.isIndoor !== undefined) {
        contextStr += ` (${context.location.isIndoor ? 'indoor' : 'outdoor'})`;
      }
    }

    // Status information
    if (context.status) {
      const statuses = [];
      if (context.status.isInjured) {
        statuses.push(context.status.injuryType ? `injured (${context.status.injuryType})` : 'injured');
      }
      if (context.status.isTrapped) statuses.push('trapped');
      if (statuses.length > 0) {
        contextStr += `\n- Physical Status: ${statuses.join(', ')}`;
      } else if (context.status.isInjured === false) {
        contextStr += '\n- Physical Status: safe/uninjured';
      }
    }

    // Companions information
    if (context.companions !== undefined) {
      if (context.companions.count === 0) {
        contextStr += '\n- People: alone';
      } else {
        contextStr += `\n- People: with ${context.companions.count} other${context.companions.count > 1 ? 's' : ''}`;
        const details = [];
        if (context.companions.hasChildren) details.push('including children');
        if (context.companions.hasElderly) details.push('including elderly');
        if (details.length > 0) {
          contextStr += ` (${details.join(', ')})`;
        }
      }
    }

    // Resources information
    if (context.resources) {
      const available = [];
      const unavailable = [];
      
      if (context.resources.hasWater === true) available.push('water');
      else if (context.resources.hasWater === false) unavailable.push('water');
      
      if (context.resources.hasFood === true) available.push('food');
      else if (context.resources.hasFood === false) unavailable.push('food');
      
      if (context.resources.hasPhone === true) available.push('working phone');
      else if (context.resources.hasPhone === false) unavailable.push('phone');
      
      if (context.resources.hasPower === true) available.push('electricity');
      else if (context.resources.hasPower === false) unavailable.push('power');
      
      if (available.length > 0) {
        contextStr += `\n- Available Resources: ${available.join(', ')}`;
      }
      if (unavailable.length > 0) {
        contextStr += `\n- Missing Resources: ${unavailable.join(', ')}`;
      }
    }

    contextStr += '\n';
    
    console.log('Formatted context for prompt:', contextStr);
    console.log('=====================================');
    
    return contextStr;
  }, [context]);

  // Clear context
  const clearContext = useCallback(() => {
    setContext({});
  }, []);

  return {
    context,
    updateContext,
    formatContextForPrompt,
    clearContext
  };
};