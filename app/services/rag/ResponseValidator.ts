import { KnowledgeItem } from '../../data/types';

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  warnings: string[];
  blockedContent?: string;
}

export class ResponseValidator {
  private static instance: ResponseValidator;

  private constructor() {}

  public static getInstance(): ResponseValidator {
    if (!ResponseValidator.instance) {
      ResponseValidator.instance = new ResponseValidator();
    }
    return ResponseValidator.instance;
  }

  /**
   * Validates if AI response stays within knowledge boundaries
   */
  public validateResponse(
    userQuery: string,
    aiResponse: string,
    usedKnowledge: KnowledgeItem[]
  ): ValidationResult {
    const warnings: string[] = [];
    let confidence = 1.0;

    // Check 1: Response should not contain forbidden phrases
    const forbiddenPhrases = [
      'i think', 'i believe', 'probably', 'maybe', 'might be',
      'in my opinion', 'generally speaking', 'usually',
      '我认为', '我觉得', '可能', '也许', '大概', '一般来说'
    ];

    const responseLower = aiResponse.toLowerCase();
    for (const phrase of forbiddenPhrases) {
      if (responseLower.includes(phrase)) {
        warnings.push(`Contains uncertain language: "${phrase}"`);
        confidence -= 0.2;
      }
    }

    // Check 2: Response should contain content from knowledge base
    if (usedKnowledge.length > 0) {
      const knowledgeContent = usedKnowledge.map(k => k.content).join(' ').toLowerCase();
      const responseWords = responseLower.split(/\s+/);
      const knowledgeWords = knowledgeContent.split(/\s+/);
      
      const overlapCount = responseWords.filter(word => 
        word.length > 3 && knowledgeWords.includes(word)
      ).length;
      
      const overlapRatio = overlapCount / responseWords.length;
      
      if (overlapRatio < 0.3) {
        warnings.push('Response content significantly deviates from knowledge base');
        confidence -= 0.3;
      }
    }

    // Check 3: Medical advice should always recommend professional help
    const medicalKeywords = ['bleeding', 'injury', 'pain', 'unconscious', 'broken'];
    const queryContainsMedical = medicalKeywords.some(keyword => 
      userQuery.toLowerCase().includes(keyword)
    );
    
    if (queryContainsMedical && !aiResponse.includes('emergency') && !aiResponse.includes('professional')) {
      warnings.push('Medical query should recommend professional help');
      confidence -= 0.4;
    }

    // Check 4: Response should not give advice for non-earthquake topics
    const earthquakeKeywords = ['earthquake', 'shaking', 'aftershock', 'tremor', '地震'];
    const queryHasEarthquake = earthquakeKeywords.some(keyword => 
      userQuery.toLowerCase().includes(keyword)
    );
    
    if (!queryHasEarthquake && usedKnowledge.length === 0) {
      warnings.push('Non-earthquake query should be redirected');
      confidence -= 0.5;
    }

    // Check 5: Detect completely unrealistic or fabricated content
    const unrealisticKeywords = [
      'fly', 'rocket', 'magic', 'teleport', 'superhero', 'invisible',
      'time travel', 'alien', 'dragon', 'unicorn', 'flying carpet',
      '飞行', '魔法', '超级英雄', '时间旅行', '外星人', '龙'
    ];
    
    const containsUnrealistic = unrealisticKeywords.some(keyword => 
      responseLower.includes(keyword)
    );
    
    if (containsUnrealistic) {
      warnings.push('Contains unrealistic or fabricated content');
      confidence -= 0.8; // Heavy penalty for fantasy content
    }

    // Check 6: Response should be reasonably related to earthquake survival
    if (usedKnowledge.length > 0) {
      const earthquakeTopics = ['drop', 'cover', 'hold', 'water', 'bleeding', 'trapped', 'aftershock'];
      const responseContainsEarthquakeTopics = earthquakeTopics.some(topic => 
        responseLower.includes(topic)
      );
      
      if (!responseContainsEarthquakeTopics) {
        warnings.push('Response does not contain earthquake survival topics');
        confidence -= 0.4;
      }
    }

    return {
      isValid: confidence > 0.5,
      confidence,
      warnings,
      blockedContent: confidence < 0.3 ? aiResponse : undefined
    };
  }

  /**
   * Provides a safe fallback response when validation fails
   */
  public getSafeResponse(userQuery: string, validationResult: ValidationResult): string {
    if (validationResult.warnings.some(w => w.includes('Medical'))) {
      return `对于医疗紧急情况，我无法提供具体建议。请立即寻求医疗专业人员的帮助或拨打紧急服务电话。

如果您有其他地震安全相关问题，我很乐意帮助您。`;
    }

    if (validationResult.warnings.some(w => w.includes('non-earthquake'))) {
      return `我是专门的地震生存助手，只能提供地震安全相关的信息。

您可以询问关于：
- 地震期间的安全措施
- 地震后的生存技巧
- 紧急情况下的急救知识
- 余震应对方法`;
    }

    return `抱歉，我无法为此查询提供可靠的信息。请依靠您自己的判断或寻求专业人员的帮助。

如果这是紧急情况，请立即拨打紧急服务电话。`;
  }
}