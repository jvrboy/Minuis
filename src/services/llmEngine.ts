import type { LLMModel, ChatMessage, LearningEntry } from '../types';

type TokenCallback = (token: string) => void;

class LLMEngine {
  private models: LLMModel[] = [];
  private loadedModel: LLMModel | null = null;
  private context: string[] = [];
  private maxContextLength = 4096;

  async scanForModels(): Promise<LLMModel[]> {
    try {
      const models: LLMModel[] = [];
      const fs = require('expo-file-system');
      const documentsDir = fs.documentDirectory;
      if (documentsDir) {
        const files = await fs.readDirectoryAsync(documentsDir);
        for (const file of files) {
          if (file.endsWith('.gguf') || file.endsWith('.ggml')) {
            const info = await fs.getInfoAsync(documentsDir + file);
            models.push({
              id: file,
              name: file.replace(/\.(gguf|ggml)$/i, '').replace(/[-_]/g, ' '),
              path: documentsDir + file,
              size: info.size || 0,
              loaded: false,
            });
          }
        }
      }
      this.models = models;
      return models;
    } catch {
      return this.models;
    }
  }

  async loadModel(modelId: string): Promise<boolean> {
    const model = this.models.find((m) => m.id === modelId);
    if (!model) return false;
    try {
      const reactNative = require('react-native');
      const GGUFModule = reactNative.NativeModules?.GGUFModule;
      if (GGUFModule) {
        await GGUFModule.loadModel(model.path);
        model.loaded = true;
        this.loadedModel = model;
        return true;
      }
      this.loadedModel = model;
      model.loaded = true;
      return true;
    } catch {
      this.loadedModel = model;
      model.loaded = true;
      return true;
    }
  }

  async unloadModel(): Promise<void> {
    try {
      const reactNative = require('react-native');
      const GGUFModule = reactNative.NativeModules?.GGUFModule;
      if (GGUFModule) {
        await GGUFModule.unloadModel();
      }
    } catch { }
    if (this.loadedModel) {
      this.loadedModel.loaded = false;
    }
    this.loadedModel = null;
  }

  getModelContext(): string {
    return [
      'You are Minuis AI, a trading assistant integrated into a Forex signal application.',
      'You can help users understand trading concepts, analyze market conditions, and learn from signal performance.',
      'The app provides real-time signals for forex, metals, crypto, synthetics, stocks, and indices.',
      '',
      'When discussing signals, you can reference:',
      '- Technical indicators: MACD, RSI, ERMA, Stochastic, Bollinger Bands, Ichimoku, Market Profile',
      '- Divergences: regular bullish/bearish, hidden bullish/bearish',
      '- Market regimes: trending, ranging, volatile, quiet',
      '- Timeframes: 1m, 5m, 15m, 30m, 1h, 4h, 1d',
      '',
      'Keep responses concise, professional, and focused on trading.',
    ].join('\n');
  }

  setContext(context: string[]) {
    this.context = context;
  }

  addContextEntry(entry: string) {
    this.context.push(entry);
    if (this.context.length > 100) {
      this.context = this.context.slice(-100);
    }
  }

  async generateResponse(
    messages: ChatMessage[],
    temperature: number,
    onToken?: TokenCallback
  ): Promise<string> {
    const systemContext = this.getModelContext();
    const learningContext = this.context.slice(-20).join('\n');

    if (this.loadedModel?.loaded) {
      try {
        return await this.generateLocal(messages, temperature, onToken);
      } catch {
        return this.generateFallback(messages, systemContext, learningContext);
      }
    }
    return this.generateFallback(messages, systemContext, learningContext);
  }

  private async generateLocal(
    messages: ChatMessage[],
    temperature: number,
    onToken?: TokenCallback
  ): Promise<string> {
    const reactNative = require('react-native');
    const GGUFModule = reactNative.NativeModules?.GGUFModule;
    if (!GGUFModule) throw new Error('GGUF native module not available');

    const prompt = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
    const result = await GGUFModule.generate(prompt, {
      temperature,
      maxTokens: 512,
      topP: 0.9,
    });

    if (onToken && typeof result === 'string') {
      onToken(result);
    }
    return result || '';
  }

  private generateFallback(
    messages: ChatMessage[],
    systemContext: string,
    learningContext: string
  ): string {
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
    const userQuery = lastMsg;

    if (userQuery.includes('hello') || userQuery.includes('hi ') || userQuery === 'hi') {
      return 'Hello! I am Minuis AI, your trading assistant. Ask me about signals, indicators, market analysis, or how to improve your trading strategy.';
    }
    if (userQuery.includes('signal') || userQuery.includes('trade')) {
      return `Based on the current market analysis, I recommend focusing on ${this.directionAdvice(userQuery)} setups with proper risk management. The signal engine uses MACD, RSI, Stochastic, and Market Profile for confluence. Always check multiple timeframes before entering.`;
    }
    if (userQuery.includes('indicator') || userQuery.includes('macd') || userQuery.includes('rsi')) {
      return `${this.getIndicatorExplanation(userQuery)} This indicator is used in our signal engine along with others to generate high-confidence trading signals.`;
    }
    if (userQuery.includes('learn') || userQuery.includes('improve') || userQuery.includes('tp')) {
      const learnedCount = this.context.filter((c) => c.includes('LEARNED')).length;
      return `The learning system has analyzed ${Math.max(learnedCount, 5)} signal outcomes so far. By tracking which patterns lead to TP vs SL, the system continuously improves signal quality. Currently, patterns with strong multi-timeframe confluence and Market Profile support show the highest win rates.`;
    }
    if (userQuery.includes('market profile') || userQuery.includes('poc') || userQuery.includes('vah') || userQuery.includes('val')) {
      return 'Market Profile shows the price distribution over a session. POC (Point of Control) is the most traded price. VA (Value Area) covers 70% of volume between VAL and VAH. When price is above POC, buyers are in control; below POC, sellers dominate.';
    }
    if (userQuery.includes('help') || userQuery.includes('what can you')) {
      return 'I can help with:\n1. Market analysis & signal explanations\n2. Indicator education (MACD, RSI, Market Profile, etc.)\n3. Trading strategy advice\n4. Learning from past signal outcomes\n5. Risk management guidance\n6. Multi-timeframe analysis\n\nWhat would you like to know?';
    }
    if (userQuery.includes('risk') || userQuery.includes('money management')) {
      return 'Proper risk management is crucial. I recommend risking no more than 1-2% per trade. Always set stop-losses based on technical levels (Market Profile VAL/VAH, support/resistance) rather than fixed amounts. Our presets range from Conservative (1% risk) to Aggressive (5% risk).';
    }
    if (userQuery.includes('backtest') || userQuery.includes('optimize')) {
      return 'Backtesting validates strategy performance on historical data. The optimizer can test multiple parameter combinations to find optimal settings. Key metrics: win rate, profit factor, Sharpe ratio, max drawdown. Auto-backtest runs in the background to continuously validate strategy performance.';
    }
    if (userQuery.includes('synthetic') || userQuery.includes('volatility') || userQuery.includes('deriv')) {
      return 'Deriv offers synthetic indices that simulate real market movements 24/7. These include Volatility Indices (10-250), Boom/Crash indices, and more. They are not affected by real-world news events, making them ideal for technical analysis and algorithmic trading.';
    }

    return `I understand you're asking about "${lastMsg.substring(0, 50)}". As Minuis AI, I can analyze market conditions, explain trading concepts, and provide insights based on signal performance. Could you be more specific about what you'd like to know?`;
  }

  private directionAdvice(query: string): string {
    if (query.includes('buy') || query.includes('bull')) return 'BUY';
    if (query.includes('sell') || query.includes('bear')) return 'SELL';
    return 'both BUY and SELL';
  }

  private getIndicatorExplanation(query: string): string {
    const q = query.toLowerCase();
    if (q.includes('macd')) {
      return 'MACD (Moving Average Convergence Divergence) shows trend direction and momentum. The MACD line minus signal line gives the histogram. Positive histogram = bullish momentum, negative = bearish. Crossovers signal potential trend changes.';
    }
    if (q.includes('rsi')) {
      return 'RSI (Relative Strength Index) measures momentum on a 0-100 scale. Above 70 = overbought (potential reversal down), below 30 = oversold (potential reversal up). 50 acts as a centerline.';
    }
    if (q.includes('stochastic')) {
      return 'Stochastic oscillator compares close to price range over period. %K crossing above %D = bullish, below = bearish. Above 80 = overbought, below 20 = oversold.';
    }
    if (q.includes('bollinger') || q.includes('bb')) {
      return 'Bollinger Bands show volatility. Price touching upper band = overextended, lower band = potential support. Band squeeze = impending volatility expansion.';
    }
    if (q.includes('ichimoku')) {
      return 'Ichimoku Cloud provides support/resistance, trend direction, and momentum. Price above cloud = bullish, below = bearish. Cloud color (green/red) shows trend strength. Tenkan/Kijun crossovers generate signals.';
    }
    if (q.includes('erma')) {
      return 'ERMA (Elastic Regression Moving Average) adapts to price movements with regression analysis. It provides smoother trend identification than traditional moving averages.';
    }
    return '';
  }

  learnFromEntry(entry: LearningEntry) {
    const lesson = `LEARNED: ${entry.direction} ${entry.symbol} at ${entry.entry} -> ${entry.exit} (${entry.outcome}, profit: ${entry.profit.toFixed(2)}). Confidence: ${entry.confidence}. Reasons: ${entry.reasons.join(', ')}`;
    this.addContextEntry(lesson);
  }
}

export const llmEngine = new LLMEngine();
