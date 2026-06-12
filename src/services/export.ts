import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SignalHistoryEntry, BacktestResult, Trade } from '../types';

function escapeCSV(val: string | number | undefined): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function signalsToCSV(signals: SignalHistoryEntry[]): string {
  const header = 'ID,Symbol,Direction,Entry,StopLoss,TakeProfit,Confidence,Strength,Timeframe,Status,Timestamp,ClosedAt,Profit,ProfitPips,Reasons';
  const rows = signals.map((s) =>
    [
      s.id, s.symbol, s.direction, s.entry, s.stopLoss, s.takeProfit,
      s.confidence, s.strength, s.timeframe, s.status, s.timestamp,
      s.closedAt || '', s.profit || '', s.profitPips || '',
      escapeCSV(s.reasons.join('; ')),
    ].map(escapeCSV).join(',')
  );
  return [header, ...rows].join('\n');
}

export function tradesToCSV(trades: Trade[]): string {
  const header = 'ID,Symbol,Direction,Entry,Exit,Size,StopLoss,TakeProfit,EntryTime,ExitTime,Profit,ProfitPips,Status';
  const rows = trades.map((t) =>
    [
      t.id, t.symbol, t.direction, t.entry, t.exitPrice || '', t.size,
      t.stopLoss, t.takeProfit, t.entryTime, t.exitTime || '',
      t.profit || '', t.profitPips || '', t.status,
    ].map(escapeCSV).join(',')
  );
  return [header, ...rows].join('\n');
}

export function backtestToCSV(result: BacktestResult): string {
  const header = 'EntryTime,ExitTime,Direction,Entry,Exit,Profit,ProfitPips,Confidence';
  const rows = result.trades.map((t) =>
    [t.entryTime, t.exitTime, t.direction, t.entry, t.exit, t.profit, t.profitPips, t.confidence]
      .map(escapeCSV).join(',')
  );
  const summary = `\n\nTotal Trades,${result.totalTrades}\nWin Rate,${result.winRate}%\nProfit Factor,${result.profitFactor}\nTotal P&L,${result.totalProfit}\nMax DD,${result.maxDrawdown}%\nSharpe,${result.sharpeRatio}`;
  return [header, ...rows, summary].join('\n');
}

export async function shareCSV(content: string, filename: string) {
  try {
    const path = `${FileSystem.cacheDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(path, content, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: 'text/csv' });
    }
  } catch { }
}
