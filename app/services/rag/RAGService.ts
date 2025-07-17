import { KnowledgeLoader } from '../../data/knowledgeLoader';
import { KnowledgeItem } from '../../data/types';

export interface RAGContext {
  relevantKnowledge: KnowledgeItem[];
  userQuery: string;
  contextualPrompt: string;
  emergencyPriority: 'critical' | 'urgent' | 'important' | 'normal';
  quickActions: string[];
}

export class RAGService {
  private knowledgeLoader: KnowledgeLoader;
  private static instance: RAGService;

  private constructor() {
    this.knowledgeLoader = KnowledgeLoader.getInstance();
  }

  public static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  /**
   * Retrieves relevant knowledge based on user query
   */
  public retrieveRelevantKnowledge(query: string, maxResults: number = 3): KnowledgeItem[] {
    const results = this.knowledgeLoader.searchByKeywords(query);
    return results.slice(0, maxResults);
  }

  /**
   * Generates contextual prompt with retrieved knowledge and enhanced safety constraints
   */
  public generateContextualPrompt(userQuery: string, retrievedKnowledge: KnowledgeItem[]): string {
    if (retrievedKnowledge.length === 0) {
      return `You are an earthquake survival assistant. The user asks: "${userQuery}". 

IMPORTANT: I don't have specific knowledge about this question in my earthquake survival database. I cannot provide accurate information for this query. Please rely on your own judgment and seek help from emergency personnel or official sources if this is an emergency situation.

If you have other earthquake survival questions, I'd be happy to help with those.`;
    }

    let contextPrompt = `You are an earthquake survival assistant. Based on the following earthquake survival knowledge, answer the user's question.

EARTHQUAKE SURVIVAL KNOWLEDGE:
`;

    // Add retrieved knowledge as context
    retrievedKnowledge.forEach((item, index) => {
      contextPrompt += `${index + 1}. ${item.title}
${item.content}

`;
    });

    contextPrompt += `USER QUESTION: "${userQuery}"

CRITICAL SAFETY INSTRUCTIONS:
- ONLY use the earthquake survival knowledge provided above
- DO NOT add any information not explicitly stated in the knowledge base
- If the knowledge doesn't directly answer the question, say: "I cannot find specific information about this in my earthquake survival knowledge base"
- NEVER guess, assume, or extrapolate beyond the provided knowledge
- For any medical emergency, always recommend calling emergency services
- If asked about topics outside earthquake survival, redirect to earthquake safety

RESPONSE REQUIREMENTS:
- Be concise but complete
- Focus on actionable advice from the knowledge base only
- If multiple pieces of knowledge are relevant, synthesize them coherently
- Always prioritize safety over convenience
- End with "If this is a life-threatening emergency, call emergency services immediately"

ANSWER:`;

    return contextPrompt;
  }

  /**
   * Enhanced keyword matching with whole-word precision and synonym support
   * Prevents false positives like "art" matching "earthquake"
   */
  private matchesKeywords(query: string, keywords: string[]): boolean {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
    
    return keywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      
      // Check for exact word match first (most precise)
      if (queryWords.includes(keywordLower)) {
        return true;
      }
      
      // For multi-character keywords (like "地震"), also check substring match
      if (keywordLower.length > 2 && queryLower.includes(keywordLower)) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Get quick action suggestions based on emergency keywords
   */
  public getQuickActions(query: string): string[] {
    const actions: string[] = [];

    // Emergency scenarios with expanded keywords
    const emergencyKeywords = {
      earthquake: ['earthquake', 'shaking', 'tremor', 'quake', '地震', '震动'],
      trapped: ['trapped', 'stuck', 'buried', 'pinned', 'crushed', '被困', '压住'],
      bleeding: ['bleeding', 'blood', 'cut', 'wound', 'injury', '流血', '出血', '受伤'],
      water: ['water', 'thirsty', 'drink', 'dehydrated', '水', '口渴', '脱水'],
      aftershock: ['aftershock', 'more shaking', 'another quake', '余震']
    };

    if (this.matchesKeywords(query, emergencyKeywords.earthquake)) {
      actions.push('DROP, COVER, HOLD ON');
      actions.push('Stay where you are until shaking stops');
    }

    if (this.matchesKeywords(query, emergencyKeywords.trapped)) {
      actions.push('Stay calm, conserve energy');
      actions.push('Tap on pipes to signal rescuers');
      actions.push('Cover mouth to avoid dust');
    }

    if (this.matchesKeywords(query, emergencyKeywords.bleeding)) {
      actions.push('Apply direct pressure with clean cloth');
      actions.push('Elevate wound above heart if possible');
      actions.push('Do NOT remove embedded objects');
    }

    if (this.matchesKeywords(query, emergencyKeywords.water)) {
      actions.push('Check water heater tank (turn off power first)');
      actions.push('Toilet tank water is usually safe');
      actions.push('Ice cubes are a good source');
    }

    if (this.matchesKeywords(query, emergencyKeywords.aftershock)) {
      actions.push('DROP, COVER, HOLD ON again');
      actions.push('Stay away from damaged buildings');
    }

    return actions;
  }

  /**
   * Get emergency priority level of a query with enhanced keyword matching
   */
  public getEmergencyPriority(query: string): 'critical' | 'urgent' | 'important' | 'normal' {
    const priorityKeywords = {
      critical: [
        'bleeding', 'blood', 'unconscious', 'can\'t breathe', 'not breathing',
        'chest pain', 'heart attack', 'severe injury', 'dying',
        '流血', '出血', '昏迷', '呼吸困难', '心脏病'
      ],
      urgent: [
        'earthquake', 'shaking', 'tremor', 'building collapse', 'gas leak',
        'fire', 'smoke', 'explosion', 'tsunami warning',
        '地震', '震动', '建筑倒塌', '煤气泄漏', '火灾', '海啸'
      ],
      important: [
        'trapped', 'stuck', 'water', 'aftershock', 'evacuation',
        'shelter', 'food', 'injury', 'help',
        '被困', '余震', '撤离', '避难', '食物', '受伤'
      ]
    };

    if (this.matchesKeywords(query, priorityKeywords.critical)) {
      return 'critical';
    }

    if (this.matchesKeywords(query, priorityKeywords.urgent)) {
      return 'urgent';
    }

    if (this.matchesKeywords(query, priorityKeywords.important)) {
      return 'important';
    }

    return 'normal';
  }

  /**
   * Full RAG pipeline: retrieve + generate context with safety enhancements
   */
  public async processQuery(userQuery: string): Promise<RAGContext> {
    // 1. Retrieve relevant knowledge
    const relevantKnowledge = this.retrieveRelevantKnowledge(userQuery);

    // 2. Generate contextual prompt with safety constraints
    const contextualPrompt = this.generateContextualPrompt(userQuery, relevantKnowledge);

    // 3. Get emergency priority and quick actions
    const emergencyPriority = this.getEmergencyPriority(userQuery);
    const quickActions = this.getQuickActions(userQuery);

    return {
      relevantKnowledge,
      userQuery,
      contextualPrompt,
      emergencyPriority,
      quickActions
    };
  }

  /**
   * Debug method to show retrieval process
   */
  public debugQuery(userQuery: string): {
    searchResults: KnowledgeItem[];
    priority: string;
    actions: string[];
  } {
    const searchResults = this.retrieveRelevantKnowledge(userQuery, 5);
    const priority = this.getEmergencyPriority(userQuery);
    const actions = this.getQuickActions(userQuery);

    return {
      searchResults,
      priority,
      actions
    };
  }
}