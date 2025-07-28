/**
 * Phi-4 ONNX Model Runner - Proper Implementation
 * Uses ONNX Runtime to run the Phi-4 model with real inference
 */

const ort = require('onnxruntime-node');
const path = require('path');
const fs = require('fs').promises;
const { ModelManager } = require('./model-manager.cjs');
const { Phi4HFTokenizer } = require('./phi4-tokenizer-hf.cjs');

class Phi4ModelRunner {
  constructor() {
    this.session = null;
    this.modelManager = new ModelManager();
    this.tokenizer = null;
    this.modelPath = null;
    this.tokenizerPath = null;
    this.isInitialized = false;
    
    // Model configuration
    this.maxLength = 2048; // Maximum sequence length
    this.temperature = 0.3; // Lower temperature for faster, more focused generation
    this.topP = 0.9;  // Slightly lower for faster sampling
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Ensure model exists (download if necessary)
      const { modelPath, tokenizerPath } = await this.modelManager.ensureModelExists();
      this.modelPath = modelPath;
      this.tokenizerPath = tokenizerPath;
      
      // Initialize tokenizer
      console.log('🔧 Initializing tokenizer...');
      this.tokenizer = new Phi4HFTokenizer(modelPath);
      await this.tokenizer.initialize();
      
      // Create inference session
      console.log('🔧 Loading Phi-4 ONNX model...');
      console.log('   Model path:', this.modelPath);
      
      // Load with minimal options first
      // Try CoreML first for Apple Silicon, fallback to CPU
      const providers = process.platform === 'darwin' ? [
        {
          name: 'CoreMLExecutionProvider',
          providerOptions: {
            ModelFormat: 'NeuralNetwork',
            MLComputeUnits: 'CPUAndNeuralEngine', // Use Neural Engine for speed
            RequireStaticInputShapes: '0',
            EnableOnSubgraphs: '0'
          }
        },
        'cpu' // Fallback
      ] : ['cpu'];
      
      this.session = await ort.InferenceSession.create(this.modelPath, {
        executionProviders: providers,
        logSeverityLevel: 3,
        interOpNumThreads: 4,
        intraOpNumThreads: 4,
        graphOptimizationLevel: 'all'
      });
      
      // Log model input/output names for debugging
      console.log('   Model inputs:', this.session.inputNames);
      console.log('   Model outputs:', this.session.outputNames);
      
      this.isInitialized = true;
      console.log('✅ Phi-4 ONNX model loaded successfully');
    } catch (error) {
      console.error('Failed to initialize Phi-4 model:', error);
      throw new Error(`Model initialization failed: ${error.message}`);
    }
  }

  async analyzeProject(projectData) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { systemPrompt, analysisPrompt, projectData: data } = projectData;
    
    try {
      // Format the prompt for Phi-4 - use natural language
      const formattedPrompt = this.tokenizer.formatPrompt(systemPrompt, analysisPrompt, false);
      console.log('📝 Formatted prompt length:', formattedPrompt.length, 'characters');
      
      // Tokenize the input
      const rawTokenIds = this.tokenizer.tokenize(formattedPrompt);
      
      // Validate token IDs
      const inputIds = rawTokenIds.map(id => {
        if (id === undefined || id === null || isNaN(id)) {
          console.warn('Invalid token ID in input:', id);
          return 0; // Use padding token as fallback
        }
        return id;
      });
      
      console.log('🔤 Tokenized input length:', inputIds.length, 'tokens');
      
      // Truncate if too long
      const maxInputLength = Math.min(this.maxLength - 500, 1500); // Leave room for generation
      const truncatedIds = inputIds.slice(0, maxInputLength);
      
      // Generate response
      console.log('🤖 Generating response...');
      const generatedText = await this.generate(truncatedIds);
      
      // Parse the response
      console.log('📊 Parsing response...');
      
      // Return the natural language response
      return this.parseNaturalLanguageResponse(generatedText, data);
      
    } catch (error) {
      console.error('Error during model inference:', error);
      console.log('⚠️ Using enhanced fallback analysis due to model error');
      // Fallback to a comprehensive analysis based on project structure
      return this.getFallbackAnalysis(data);
    }
  }

  async generate(inputIds, maxNewTokens = 150) { // Reduced due to M2 CPU performance (1 sec/token)
    try {
      const batchSize = 1;
      let currentIds = [...inputIds];
      let generatedTokens = [];
      let pastKeyValues = null;
      
      console.log('🔤 Starting generation with', inputIds.length, 'input tokens');
      const startTime = Date.now();
      
      // Generate tokens iteratively
      for (let step = 0; step < maxNewTokens; step++) {
        // Prepare input for this step
        const inputLength = pastKeyValues ? 1 : currentIds.length;
        const inputSlice = pastKeyValues ? [currentIds[currentIds.length - 1]] : currentIds;
        
        // Create input tensors - validate IDs first
        const validatedSlice = inputSlice.map(id => {
          if (id === undefined || id === null || isNaN(id)) {
            console.warn('Invalid token ID detected:', id, '- using 0');
            return 0;
          }
          return id;
        });
        
        const inputIdsTensor = new ort.Tensor('int64', 
          new BigInt64Array(validatedSlice.map(id => BigInt(id))), 
          [batchSize, inputLength]
        );
        
        // Create attention mask
        const totalLength = currentIds.length;
        const attentionMask = new ort.Tensor('int64',
          new BigInt64Array(totalLength).fill(1n),
          [batchSize, totalLength]
        );
        
        // Prepare feeds
        const feeds = {
          input_ids: inputIdsTensor,
          attention_mask: attentionMask
        };
        
        // Add past key values if available
        if (pastKeyValues) {
          Object.assign(feeds, pastKeyValues);
        } else {
          // Initialize empty KV cache for first pass
          for (let i = 0; i < 32; i++) {
            feeds[`past_key_values.${i}.key`] = new ort.Tensor('float32', 
              new Float32Array(0), [batchSize, 8, 0, 128]);
            feeds[`past_key_values.${i}.value`] = new ort.Tensor('float32', 
              new Float32Array(0), [batchSize, 8, 0, 128]);
          }
        }
        
        // Run inference
        const output = await this.session.run(feeds);
        
        // Debug output structure
        if (step === 0) {
          console.log('📊 Model output keys:', Object.keys(output));
          console.log('📊 Logits shape:', output.logits?.dims);
        }
        
        // Get logits for the last position
        const logits = output.logits;
        if (!logits || !logits.data) {
          console.error('❌ No logits in model output');
          break;
        }
        
        const [batchDim, seqDim, vocabSize] = logits.dims;
        const lastPosition = seqDim - 1;
        const logitsData = logits.data;
        
        // Extract logits for last token - correct indexing for batch
        const lastLogits = new Float32Array(vocabSize);
        const offset = lastPosition * vocabSize; // For batch size 1, no batch offset needed
        
        for (let i = 0; i < vocabSize; i++) {
          const value = logitsData[offset + i];
          // Clamp extreme values to prevent NaN in exp
          lastLogits[i] = Math.max(-100, Math.min(100, value));
        }
        
        // Debug: Check if we have valid logits
        if (step === 0) {
          const validLogits = lastLogits.filter(l => !isNaN(l) && isFinite(l));
          console.log(`   Valid logits: ${validLogits.length}/${vocabSize}`);
          const maxLogit = Math.max(...lastLogits.slice(0, 100)); // Check first 100
          const minLogit = Math.min(...lastLogits.slice(0, 100));
          console.log(`   Logit range: [${minLogit.toFixed(2)}, ${maxLogit.toFixed(2)}]`);
        }
        
        // Sample next token
        const nextTokenId = this.sampleToken(lastLogits);
        
        // Validate the sampled token
        if (nextTokenId === undefined || nextTokenId === null || isNaN(nextTokenId)) {
          console.error('❌ Invalid token sampled:', nextTokenId);
          break;
        }
        
        if (step % 50 === 0) {
          console.log(`   Step ${step}: Generated token ${nextTokenId}`);
        }
        
        generatedTokens.push(nextTokenId);
        currentIds.push(nextTokenId);
        
        // Check for end token
        // From tokenizer_config.json: <|endoftext|> is 199999, <|end|> is 200020
        if (nextTokenId === 199999 || // <|endoftext|>
            nextTokenId === 200020) {  // <|end|>
          console.log('   Hit end token, stopping generation');
          break;
        }
        
        // Update past key values for next iteration
        pastKeyValues = {};
        for (let i = 0; i < 32; i++) {
          pastKeyValues[`past_key_values.${i}.key`] = output[`present.${i}.key`];
          pastKeyValues[`past_key_values.${i}.value`] = output[`present.${i}.value`];
        }
        
        // Progress indicator
        if (step % 10 === 0) {
          process.stderr.write('.');
        }
      }
      
      // Decode generated tokens
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;
      const tokensPerSecond = generatedTokens.length / totalTime;
      console.log('\n✅ Generated', generatedTokens.length, 'tokens in', totalTime.toFixed(1), 'seconds');
      console.log('⚡ Speed:', tokensPerSecond.toFixed(1), 'tokens/second');
      console.log('🔍 First 10 tokens:', generatedTokens.slice(0, 10));
      console.log('🔍 Last 10 tokens:', generatedTokens.slice(-10));
      
      const generatedText = this.tokenizer.decode(generatedTokens);
      
      // Clean up any special tokens that shouldn't be in the output
      const cleanedText = generatedText
        .replace(/<\|[^>]+\|>/g, '') // Remove any remaining special tokens
        .trim();
      
      console.log('📝 Generated text preview:', cleanedText.substring(0, 200) + '...');
      
      return cleanedText;
      
    } catch (error) {
      console.error('Generation error:', error);
      throw error;
    }
  }

  sampleToken(logits) {
    try {
      // Validate input
      if (!logits || logits.length === 0) {
        console.error('❌ Empty logits array');
        return 0;
      }
      
      // With very low temperature (0.1), we want more deterministic output
      const temperature = Math.max(0.01, this.temperature); // Ensure minimum temperature
      const scaledLogits = new Float32Array(logits.length);
      
      // Scale logits and find max for numerical stability
      let maxLogit = -Infinity;
      for (let i = 0; i < logits.length; i++) {
        const logit = logits[i];
        if (!isNaN(logit) && isFinite(logit)) {
          scaledLogits[i] = logit / temperature;
          if (scaledLogits[i] > maxLogit) maxLogit = scaledLogits[i];
        } else {
          scaledLogits[i] = -100; // Set invalid logits to very low value
        }
      }
      
      // Check if we found a valid max
      if (maxLogit === -Infinity || !isFinite(maxLogit)) {
        console.error('❌ No valid logits found');
        // Return a common token ID instead of 0 (which might be padding)
        return 1; // Often a common word token
      }
      
      // Subtract max for numerical stability in softmax
      const expLogits = new Float32Array(scaledLogits.length);
      let sumExp = 0;
      
      for (let i = 0; i < scaledLogits.length; i++) {
        const exp = Math.exp(scaledLogits[i] - maxLogit);
        expLogits[i] = exp;
        sumExp += exp;
      }
      
      if (sumExp === 0 || !isFinite(sumExp)) {
        console.error('❌ Sum of exp logits is 0 or infinite');
        // Just return the argmax
        let maxIdx = 0;
        let maxVal = -Infinity;
        for (let i = 0; i < logits.length; i++) {
          if (logits[i] > maxVal) {
            maxVal = logits[i];
            maxIdx = i;
          }
        }
        return maxIdx;
      }
      
      // Calculate probabilities
      const probs = new Float32Array(expLogits.length);
      for (let i = 0; i < expLogits.length; i++) {
        probs[i] = expLogits[i] / sumExp;
      }
      
      // Find top-k tokens first (more stable than pure top-p)
      const topK = Math.min(40, logits.length); // Limit to top 40 tokens
      const indexed = [];
      for (let i = 0; i < probs.length; i++) {
        if (!isNaN(probs[i]) && probs[i] > 0) {
          indexed.push({ prob: probs[i], idx: i });
        }
      }
      
      if (indexed.length === 0) {
        console.error('❌ No valid probabilities found');
        // Return argmax as fallback
        let maxIdx = 0;
        let maxVal = -Infinity;
        for (let i = 0; i < logits.length; i++) {
          if (logits[i] > maxVal) {
            maxVal = logits[i];
            maxIdx = i;
          }
        }
        return maxIdx;
      }
      
      // Sort by probability
      indexed.sort((a, b) => b.prob - a.prob);
      const topKTokens = indexed.slice(0, topK);
      
      // Apply top-p filtering on top-k tokens
      let cumSum = 0;
      let topIndices = [];
      for (const item of topKTokens) {
        cumSum += item.prob;
        topIndices.push(item.idx);
        if (cumSum >= this.topP) break;
      }
      
      // For very low temperature, often just pick the most likely token
      if (temperature <= 0.1 && topKTokens.length > 0 && topKTokens[0].prob > 0.9) {
        return topKTokens[0].idx;
      }
      
      // If no tokens pass threshold, return argmax
      if (topIndices.length === 0) {
        return topKTokens[0].idx;
      }
      
      // Otherwise sample from the filtered distribution
      const topProbs = topIndices.map(i => probs[i]);
      const topSum = topProbs.reduce((a, b) => a + b, 0);
      const normalizedProbs = topProbs.map(p => p / topSum);
      
      // Random sampling
      const random = Math.random();
      let cumProb = 0;
      for (let i = 0; i < topIndices.length; i++) {
        cumProb += normalizedProbs[i];
        if (random < cumProb) {
          return topIndices[i];
        }
      }
      
      return topIndices[0]; // Fallback to most likely
    } catch (error) {
      console.error('❌ Error in sampleToken:', error);
      return 0; // Return padding token as fallback
    }
  }

  parseNaturalLanguageResponse(generatedText, projectData) {
    console.log('📝 Processing natural language response...');
    console.log('📄 Response length:', generatedText.length, 'characters');
    console.log('📄 Response preview:', generatedText.substring(0, 200) + '...');
    
    // If response is too short or empty, use fallback
    if (!generatedText || generatedText.trim().length < 10) {
      console.warn('⚠️ Generated text too short, using fallback analysis');
      return this.getFallbackAnalysis(projectData);
    }
    
    // Extract insights and recommendations from the structured response
    const insights = [];
    const recommendations = [];
    const patterns = [];
    
    // Split into sections
    const sections = generatedText.split(/\n\d+\.|\n[A-Z][^:]+:/g);
    const lines = generatedText.split('\n');
    
    let currentSection = '';
    let summary = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect section headers
      if (trimmedLine.match(/^1\..*Overview/i)) {
        currentSection = 'overview';
        continue;
      } else if (trimmedLine.match(/^2\.|Insights?:/i)) {
        currentSection = 'insights';
        continue;
      } else if (trimmedLine.match(/^3\.|Recommendations?:/i)) {
        currentSection = 'recommendations';
        continue;
      } else if (trimmedLine.match(/^4\.|Files?.*Patterns?:/i)) {
        currentSection = 'patterns';
        continue;
      }
      
      // Extract content based on section
      if (currentSection === 'overview' && !summary && trimmedLine.length > 20) {
        summary = trimmedLine;
      }
      
      // Extract lettered sub-items (a., b., c.) or bullet points
      const letterMatch = trimmedLine.match(/^[a-z]\. (.+)/);
      const bulletMatch = trimmedLine.match(/^[-•*]\s+(.+)/);
      
      if (letterMatch || bulletMatch) {
        const content = (letterMatch ? letterMatch[1] : bulletMatch[1]).trim();
        const titleMatch = content.match(/^([^:]+):\s*(.+)/);
        
        if (currentSection === 'insights') {
          const title = titleMatch ? titleMatch[1].trim() : content.substring(0, 50);
          const description = titleMatch ? titleMatch[2].trim() : content;
          
          insights.push({
            category: this.categorizeInsight(content),
            title: title + (title.length < content.length && !titleMatch ? '...' : ''),
            description: description,
            severity: this.determineSeverity(content)
          });
        } else if (currentSection === 'recommendations') {
          const title = titleMatch ? titleMatch[1].trim() : content.substring(0, 50);
          const description = titleMatch ? titleMatch[2].trim() : content;
          
          recommendations.push({
            priority: this.determinePriority(content),
            category: this.categorizeRecommendation(content),
            title: title + (title.length < content.length && !titleMatch ? '...' : ''),
            description: description,
            impact: this.determineImpact(content)
          });
        }
      }
      
      // Extract patterns mentioned
      if (currentSection === 'patterns' && trimmedLine.includes('src/')) {
        const fileMatch = trimmedLine.match(/(src\/[^\s]+)/);
        if (fileMatch) {
          patterns.push({
            type: 'file',
            name: fileMatch[1],
            value: trimmedLine,
            quality: 'needs attention'
          });
        }
      }
    }
    
    // If no summary extracted, use first paragraph
    if (!summary) {
      const firstPara = generatedText.split('\n\n')[0];
      summary = firstPara.substring(0, 300).trim();
    }
    
    // Detect project type from the response
    const projectType = this.detectProjectType(generatedText, projectData);
    
    return {
      detectedDomain: projectType.domain,
      domainConfidence: projectType.confidence,
      summary: generatedText, // Use full markdown response as summary
      insights: insights.length > 0 ? insights : this.getDefaultInsights(projectData),
      recommendations: recommendations.length > 0 ? recommendations : this.getDefaultRecommendations(projectData),
      patterns: patterns,
      opportunities: this.extractOpportunities(recommendations),
      analysisDepth: 'deep',
      confidence: 0.9,
      fullResponse: generatedText,
      responseType: 'markdown' // Changed to markdown
    };
  }

  extractInsightsFromText(text, projectData) {
    // Basic text analysis to extract insights
    const lines = text.split('\n').filter(l => l.trim());
    const insights = [];
    const recommendations = [];
    
    // Look for bullet points or numbered lists
    lines.forEach(line => {
      if (line.match(/^[-*•]\s+(.+)/) || line.match(/^\d+\.\s+(.+)/)) {
        const content = line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
        if (content.toLowerCase().includes('recommend') || content.toLowerCase().includes('should')) {
          recommendations.push({
            priority: 'medium',
            category: 'General',
            title: content.slice(0, 50),
            description: content,
            impact: 'Improve project quality'
          });
        } else {
          insights.push({
            category: 'Analysis',
            title: content.slice(0, 50),
            description: content,
            severity: 'info'
          });
        }
      }
    });
    
    return {
      detectedDomain: 'code',
      domainConfidence: 0.7,
      summary: text.slice(0, 200) || 'Analysis completed',
      insights: insights.slice(0, 5),
      recommendations: recommendations.slice(0, 5),
      patterns: [],
      opportunities: [],
      analysisDepth: 'moderate',
      confidence: 0.7
    };
  }

  parseToolCall(toolCallText, projectData) {
    try {
      const toolCall = JSON.parse(toolCallText);
      console.log('📞 Parsed tool call:', toolCall.tool);
      
      // Example tool implementations
      const tools = {
        createAnalysisResponse: (params) => {
          // Tool to create the analysis response with individual field parameters
          return {
            result: JSON.stringify({
              detectedDomain: params.detectedDomain || 'code',
              domainConfidence: parseFloat(params.domainConfidence) || 0.85,
              summary: params.summary || 'Analysis completed',
              insights: params.insights ? (Array.isArray(params.insights) ? params.insights : [params.insights]) : [],
              recommendations: params.recommendations ? (Array.isArray(params.recommendations) ? params.recommendations : [params.recommendations]) : [],
              patterns: params.patterns || [],
              opportunities: params.opportunities || [],
              analysisDepth: params.analysisDepth || 'moderate',
              confidence: parseFloat(params.confidence) || 0.8
            }, null, 2)
          };
        },
        analyzeFileStructure: () => {
          const fileTypes = projectData?.summary?.fileTypes || {};
          const totalFiles = projectData?.summary?.totalFiles || 0;
          return {
            result: `Found ${totalFiles} files with types: ${Object.keys(fileTypes).join(', ')}`
          };
        },
        checkDependencies: () => {
          // In a real implementation, this would check package.json, requirements.txt, etc.
          return {
            result: 'Dependencies check not yet implemented'
          };
        },
        generateSummary: () => {
          return {
            result: `Project contains ${projectData?.summary?.totalFiles || 0} files across ${projectData?.summary?.directoryCount || 0} directories`
          };
        }
      };
      
      if (tools[toolCall.tool]) {
        const toolResult = tools[toolCall.tool](toolCall.parameters || {});
        console.log('🔨 Tool executed:', toolCall.tool);
        
        // Special handling for JSON formatting tools
        if (toolCall.tool === 'createAnalysisResponse' || toolCall.tool === 'populateAnalysisJSON' || toolCall.tool === 'formatAsJSON') {
          try {
            const jsonResult = JSON.parse(toolResult.result);
            console.log('✅ JSON formatting tool produced valid JSON');
            return jsonResult;
          } catch (e) {
            console.error('JSON formatting tool produced invalid JSON:', e);
          }
        }
        
        // Return analysis with tool result
        return {
          detectedDomain: 'code',
          domainConfidence: 0.9,
          summary: `Tool ${toolCall.tool} executed: ${toolResult.result}`,
          insights: [{
            category: 'Tool Execution',
            title: `${toolCall.tool} Results`,
            description: toolResult.result,
            severity: 'info'
          }],
          recommendations: [],
          patterns: [],
          opportunities: [],
          analysisDepth: 'moderate',
          confidence: 0.85,
          toolsUsed: [toolCall.tool]
        };
      } else {
        console.warn('Unknown tool requested:', toolCall.tool);
        return this.getFallbackAnalysis(projectData);
      }
    } catch (e) {
      console.error('Failed to parse tool call:', e);
      return this.getFallbackAnalysis(projectData);
    }
  }

  detectProjectType(text, data) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('react') || lowerText.includes('component') || lowerText.includes('jsx') || lowerText.includes('tsx')) {
      return { domain: 'React Application', confidence: 0.95 };
    } else if (lowerText.includes('vue') || lowerText.includes('nuxt')) {
      return { domain: 'Vue Application', confidence: 0.95 };
    } else if (lowerText.includes('angular')) {
      return { domain: 'Angular Application', confidence: 0.95 };
    } else if (lowerText.includes('python') || lowerText.includes('django') || lowerText.includes('flask')) {
      return { domain: 'Python Project', confidence: 0.9 };
    } else if (lowerText.includes('node') || lowerText.includes('express')) {
      return { domain: 'Node.js Application', confidence: 0.9 };
    } else if (lowerText.includes('mobile') || lowerText.includes('android') || lowerText.includes('ios')) {
      return { domain: 'Mobile Application', confidence: 0.9 };
    } else if (lowerText.includes('rust') || lowerText.includes('cargo')) {
      return { domain: 'Rust Project', confidence: 0.9 };
    }
    
    // Fallback to file type analysis
    const fileTypes = data?.summary?.fileTypes || {};
    if (fileTypes['.tsx'] || fileTypes['.jsx']) {
      return { domain: 'Web Application', confidence: 0.8 };
    } else if (fileTypes['.py']) {
      return { domain: 'Python Project', confidence: 0.8 };
    } else if (fileTypes['.rs']) {
      return { domain: 'Rust Project', confidence: 0.8 };
    } else if (fileTypes['.go']) {
      return { domain: 'Go Project', confidence: 0.8 };
    }
    
    return { domain: 'Software Project', confidence: 0.7 };
  }
  
  determineSeverity(content) {
    const lower = content.toLowerCase();
    if (lower.includes('error') || lower.includes('bug') || lower.includes('security')) {
      return 'high';
    } else if (lower.includes('warning') || lower.includes('inconsistent') || lower.includes('missing')) {
      return 'medium';
    }
    return 'info';
  }
  
  determinePriority(content) {
    const lower = content.toLowerCase();
    if (lower.includes('security') || lower.includes('critical') || lower.includes('error')) {
      return 'high';
    } else if (lower.includes('test') || lower.includes('refactor') || lower.includes('performance')) {
      return 'medium';
    }
    return 'low';
  }
  
  extractOpportunities(recommendations) {
    const opportunities = [];
    
    recommendations.forEach(rec => {
      if (rec.description.toLowerCase().includes('test')) {
        opportunities.push({
          area: 'Quality Assurance',
          opportunity: 'Improve test coverage',
          potential: 'high',
          effort: 'medium'
        });
      } else if (rec.description.toLowerCase().includes('refactor')) {
        opportunities.push({
          area: 'Code Quality',
          opportunity: 'Refactor for better maintainability',
          potential: 'medium',
          effort: 'medium'
        });
      }
    });
    
    return opportunities.slice(0, 3); // Return top 3
  }
  
  categorizeInsight(content) {
    const lower = content.toLowerCase();
    if (lower.includes('naming') || lower.includes('convention')) {
      return 'Code Style';
    } else if (lower.includes('test') || lower.includes('coverage')) {
      return 'Testing';
    } else if (lower.includes('component') || lower.includes('architecture')) {
      return 'Architecture';
    } else if (lower.includes('performance') || lower.includes('optimization')) {
      return 'Performance';
    } else if (lower.includes('security') || lower.includes('vulnerability')) {
      return 'Security';
    }
    return 'Code Quality';
  }
  
  categorizeRecommendation(content) {
    const lower = content.toLowerCase();
    if (lower.includes('refactor')) {
      return 'Refactoring';
    } else if (lower.includes('test')) {
      return 'Testing';
    } else if (lower.includes('document')) {
      return 'Documentation';
    } else if (lower.includes('convention') || lower.includes('style')) {
      return 'Code Style';
    } else if (lower.includes('security')) {
      return 'Security';
    }
    return 'Improvement';
  }
  
  determineImpact(content) {
    const lower = content.toLowerCase();
    if (lower.includes('security')) {
      return 'Enhanced security posture';
    } else if (lower.includes('test')) {
      return 'Improved quality assurance';
    } else if (lower.includes('refactor') || lower.includes('maintain')) {
      return 'Better maintainability';
    } else if (lower.includes('performance')) {
      return 'Improved performance';
    } else if (lower.includes('convention') || lower.includes('consistency')) {
      return 'Increased code consistency';
    }
    return 'Enhanced code quality';
  }
  
  getDefaultInsights(data) {
    const fileCount = data?.summary?.totalFiles || 0;
    const fileTypes = data?.summary?.fileTypes || {};
    
    return [
      {
        category: 'Project Structure',
        title: 'File Organization',
        description: `Project contains ${fileCount} files with ${Object.keys(fileTypes).length} different file types`,
        severity: 'info'
      }
    ];
  }
  
  getDefaultRecommendations(data) {
    return [
      {
        priority: 'medium',
        category: 'Best Practices',
        title: 'Code Review',
        description: 'Consider reviewing the code structure and organization',
        impact: 'Improved maintainability'
      }
    ];
  }

  getFallbackAnalysis(data) {
    // Enhanced fallback analysis that provides useful insights
    const fileCount = data?.summary?.totalFiles || 0;
    const totalSize = data?.summary?.totalSize || 0;
    const projectDomain = data?.summary?.projectDomain || 'code';
    const fileTypes = data?.summary?.fileTypes || {};
    const dirCount = data?.summary?.directoryCount || 1;
    
    // Analyze file types
    const hasTests = Object.keys(fileTypes).some(ext => 
      ext.includes('test') || ext.includes('spec')
    );
    const hasTypescript = fileTypes['.ts'] || fileTypes['.tsx'];
    const hasJavascript = fileTypes['.js'] || fileTypes['.jsx'];
    const hasPython = fileTypes['.py'];
    const hasMarkdown = fileTypes['.md'];
    
    // Determine project type
    let projectType = 'General';
    if (hasTypescript || hasJavascript) {
      projectType = hasTypescript ? 'TypeScript' : 'JavaScript';
      if (fileTypes['.tsx'] || fileTypes['.jsx']) {
        projectType = 'React ' + projectType;
      }
    } else if (hasPython) {
      projectType = 'Python';
    }
    
    const avgFilesPerDir = (fileCount / dirCount).toFixed(1);
    
    const insights = [];
    const recommendations = [];
    
    // Project structure insights
    insights.push({
      category: 'Project Structure',
      title: `${projectType} project with ${fileCount} files`,
      description: `Your project has ${dirCount} directories with an average of ${avgFilesPerDir} files per directory`,
      severity: 'info'
    });
    
    // File organization insight
    if (avgFilesPerDir > 20) {
      insights.push({
        category: 'Organization',
        title: 'Large directory detected',
        description: 'Some directories contain many files. Consider breaking them into subdirectories',
        severity: 'medium'
      });
      recommendations.push({
        priority: 'medium',
        category: 'Organization',
        title: 'Split large directories',
        description: 'Break directories with 20+ files into logical subdirectories',
        impact: 'Improve code navigation and maintainability'
      });
    }
    
    // Testing insights
    if (hasTests) {
      insights.push({
        category: 'Testing',
        title: 'Test files detected',
        description: 'Good practice: Your project includes test files',
        severity: 'info'
      });
    } else {
      recommendations.push({
        priority: 'high',
        category: 'Testing',
        title: 'Add unit tests',
        description: `Create test files for your ${projectType} code to ensure reliability`,
        impact: 'Catch bugs early and improve code confidence'
      });
    }
    
    // Documentation insights
    if (hasMarkdown) {
      insights.push({
        category: 'Documentation',
        title: 'Documentation present',
        description: `Found ${fileTypes['.md'] || 1} Markdown file(s)`,
        severity: 'info'
      });
    } else {
      recommendations.push({
        priority: 'medium',
        category: 'Documentation',
        title: 'Add README.md',
        description: 'Create documentation to help others understand your project',
        impact: 'Improve project accessibility and onboarding'
      });
    }
    
    // Type safety for JS projects
    if (hasJavascript && !hasTypescript) {
      recommendations.push({
        priority: 'low',
        category: 'Type Safety',
        title: 'Consider TypeScript',
        description: 'Migrate to TypeScript for better type safety and IDE support',
        impact: 'Reduce runtime errors and improve developer experience'
      });
    }
    
    return {
      detectedDomain: projectDomain,
      domainConfidence: 0.85,
      summary: `This is a ${projectType} project with ${fileCount} files across ${dirCount} directories. ${hasTests ? 'Test coverage detected.' : 'No tests found.'} ${hasMarkdown ? 'Documentation is present.' : 'Documentation could be improved.'}`,
      insights: insights,
      recommendations: recommendations,
      patterns: [
        {
          type: 'language',
          name: 'Primary Language',
          value: projectType,
          quality: 'good'
        },
        {
          type: 'structure',
          name: 'Project Organization',
          value: `${avgFilesPerDir} files per directory average`,
          quality: parseFloat(avgFilesPerDir) < 15 ? 'good' : 'needs attention'
        }
      ],
      opportunities: [
        !hasTests && {
          area: 'Quality Assurance',
          opportunity: 'Implement automated testing',
          potential: 'high',
          effort: 'medium'
        },
        parseFloat(avgFilesPerDir) > 15 && {
          area: 'Code Organization',
          opportunity: 'Refactor large directories',
          potential: 'medium',
          effort: 'low'
        }
      ].filter(Boolean),
      analysisDepth: 'moderate',
      confidence: 0.75
    };
  }
}

module.exports = { Phi4ModelRunner };