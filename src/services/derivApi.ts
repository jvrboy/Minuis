import { DERIV_WS_URL, CANDLE_INTERVAL_MAP } from '../constants';
import type { Tick, Candle, Timeframe } from '../types';
import { useStore } from '../store/useStore';

type MessageCallback = (data: any) => void;

class DerivApi {
  private ws: WebSocket | null = null;
  private reqId = 0;
  private pending: Map<number, { resolve: (v: any) => void; reject: (e: any) => void }> = new Map();
  private callbacks: Map<string, Set<MessageCallback>> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private tickSubscriptions: Set<string> = new Set();
  private candleSubscriptions: Map<string, Timeframe> = new Map();
  private isConnecting = false;

  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return Promise.resolve();
    if (this.isConnecting) return new Promise((r) => setTimeout(r, 500).then(() => this.connect()));

    this.isConnecting = true;
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(DERIV_WS_URL);

        this.ws.onopen = () => {
          this.isConnecting = false;
          useStore.getState().setConnection({ connected: true });
          this.resubscribeAll();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            this.handleMessage(msg);
          } catch { }
        };

        this.ws.onclose = () => {
          this.isConnecting = false;
          useStore.getState().setConnection({ connected: false });
          this.scheduleReconnect();
        };

        this.ws.onerror = () => {
          this.isConnecting = false;
          reject(new Error('WebSocket connection failed'));
        };
      } catch (e) {
        this.isConnecting = false;
        reject(e);
      }
    });
  }

  private handleMessage(msg: any) {
    if (msg.msg_type === 'tick') {
      const tick: Tick = {
        symbol: msg.tick.symbol,
        epoch: msg.tick.epoch,
        quote: msg.tick.quote,
        bid: msg.tick.bid,
        ask: msg.tick.ask,
      };
      useStore.getState().setLastTick(tick);
      this.emit('tick:' + tick.symbol, tick);
      return;
    }

    if (msg.msg_type === 'candles') {
      const candles: Candle[] = msg.candles.map((c: any) => ({
        symbol: msg.echo_req?.symbol || '',
        time: c.epoch,
        open: c.open,
        high: c.max,
        low: c.min,
        close: c.close,
        volume: c.volume || 0,
      }));
      this.emit('candles:' + (msg.echo_req?.symbol || ''), candles);
      return;
    }

    if (msg.msg_type === 'ohlc') {
      const ohlc = msg.ohlc;
      const candle: Candle = {
        symbol: ohlc.symbol,
        time: ohlc.epoch,
        open: ohlc.open,
        high: ohlc.max,
        low: ohlc.min,
        close: ohlc.close,
        volume: ohlc.volume || 0,
      };
      useStore.getState().addCandle(candle.symbol, candle);
      this.emit('ohlc:' + candle.symbol, candle);
      return;
    }

    const reqId = msg.echo_req?.req_id;
    if (reqId && this.pending.has(reqId)) {
      const { resolve } = this.pending.get(reqId)!;
      this.pending.delete(reqId);
      resolve(msg);
    }
  }

  private send(msg: object): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error('Not connected'));
      }
      const id = ++this.reqId;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ ...msg, req_id: id }));

      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  private resubscribeAll() {
    this.tickSubscriptions.forEach((symbol) => {
      this.subscribeTicks(symbol);
    });
    this.candleSubscriptions.forEach((tf, symbol) => {
      this.subscribeCandles(symbol, tf);
    });
  }

  async subscribeTicks(symbol: string) {
    this.tickSubscriptions.add(symbol);
    try {
      await this.send({ ticks: symbol, subscribe: 1 });
    } catch { }
  }

  async unsubscribeTicks(symbol: string) {
    this.tickSubscriptions.delete(symbol);
    try {
      await this.send({ forget_all: 'ticks' });
    } catch { }
  }

  async subscribeCandles(symbol: string, timeframe: Timeframe) {
    this.candleSubscriptions.set(symbol, timeframe);
    const granularity = CANDLE_INTERVAL_MAP[timeframe];

    try {
      await this.send({
        ticks_history: symbol,
        granularity,
        style: 'candles',
        count: 200,
        subscribe: 1,
      });
    } catch { }
  }

  async fetchCandles(symbol: string, timeframe: Timeframe, count = 200): Promise<Candle[]> {
    const granularity = CANDLE_INTERVAL_MAP[timeframe];
    try {
      const resp = await this.send({
        ticks_history: symbol,
        granularity,
        style: 'candles',
        count,
      });
      return (resp.candles || []).map((c: any) => ({
        symbol,
        time: c.epoch,
        open: c.open,
        high: c.max,
        low: c.min,
        close: c.close,
        volume: c.volume || 0,
      }));
    } catch {
      return [];
    }
  }

  async getActiveSymbols(): Promise<string[]> {
    try {
      const resp = await this.send({ active_symbols: 'brief' });
      return (resp.active_symbols || [])
        .filter((s: any) => s.market === 'forex')
        .map((s: any) => s.symbol);
    } catch {
      return [];
    }
  }

  on(event: string, cb: MessageCallback) {
    if (!this.callbacks.has(event)) this.callbacks.set(event, new Set());
    this.callbacks.get(event)!.add(cb);
    return () => this.callbacks.get(event)?.delete(cb);
  }

  private emit(event: string, data: any) {
    this.callbacks.get(event)?.forEach((cb) => cb(data));
  }

  disconnect() {
    this.tickSubscriptions.clear();
    this.candleSubscriptions.clear();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getLatency(): number {
    return 0;
  }
}

export const derivApi = new DerivApi();
