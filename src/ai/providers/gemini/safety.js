/**
 * Gemini Safety Configuration and Monitoring
 */

class GeminiSafety {
  constructor() {
    this.safetyBlocks = {
      total: 0,
      harassment: 0,
      hateSpeech: 0,
      sexuallyExplicit: 0,
      dangerousContent: 0,
      otherReason: 0
    };
  }

  getSafetySettings(mode = null) {
    const safetyMode = mode || process.env.GEMINI_SAFETY_MODE || 'BLOCK_MEDIUM_AND_ABOVE';
    
    const severityMap = {
      'BLOCK_NONE': 'BLOCK_NONE',
      'BLOCK_LOW_AND_ABOVE': 'BLOCK_LOW_AND_ABOVE',
      'BLOCK_MEDIUM_AND_ABOVE': 'BLOCK_MEDIUM_AND_ABOVE', 
      'BLOCK_ONLY_HIGH': 'BLOCK_ONLY_HIGH'
    };

    const severity = severityMap[safetyMode] || 'BLOCK_MEDIUM_AND_ABOVE';

    return [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: severity,
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH', 
        threshold: severity,
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: severity,
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: severity,
      },
    ];
  }

  processSafetyRatings(candidateResponse) {
    if (!candidateResponse?.safetyRatings) {
      return { blocked: false, reasons: [] };
    }

    const blockedReasons = [];
    let wasBlocked = false;

    candidateResponse.safetyRatings.forEach(rating => {
      if (rating.blocked) {
        wasBlocked = true;
        this.safetyBlocks.total++;
        
        switch (rating.category) {
          case 'HARM_CATEGORY_HARASSMENT':
            this.safetyBlocks.harassment++;
            blockedReasons.push('harassment');
            break;
          case 'HARM_CATEGORY_HATE_SPEECH':
            this.safetyBlocks.hateSpeech++;
            blockedReasons.push('hate_speech');
            break;
          case 'HARM_CATEGORY_SEXUALLY_EXPLICIT':
            this.safetyBlocks.sexuallyExplicit++;
            blockedReasons.push('sexually_explicit');
            break;
          case 'HARM_CATEGORY_DANGEROUS_CONTENT':
            this.safetyBlocks.dangerousContent++;
            blockedReasons.push('dangerous_content');
            break;
          default:
            this.safetyBlocks.otherReason++;
            blockedReasons.push('other');
        }
      }
    });

    return {
      blocked: wasBlocked,
      reasons: blockedReasons,
      ratings: candidateResponse.safetyRatings
    };
  }

  getSafetyStats() {
    return {
      ...this.safetyBlocks,
      safetyMode: process.env.GEMINI_SAFETY_MODE || 'BLOCK_MEDIUM_AND_ABOVE'
    };
  }

  resetSafetyStats() {
    this.safetyBlocks = {
      total: 0,
      harassment: 0,
      hateSpeech: 0,
      sexuallyExplicit: 0,
      dangerousContent: 0,
      otherReason: 0
    };
  }

  formatSafetyError(safetyInfo) {
    const reasons = safetyInfo.reasons.join(', ');
    return `Content blocked due to safety concerns: ${reasons}. Please rephrase your request.`;
  }
}

module.exports = GeminiSafety;