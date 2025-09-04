export type TelemetryCounters = {
  widgets: Record<string, number>;
};

const KEY = 'printy_admin_telemetry_v1';

function read(): TelemetryCounters {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { widgets: {} };
    return JSON.parse(raw);
  } catch {
    return { widgets: {} };
  }
}

function write(data: TelemetryCounters) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Silent fail for localStorage errors
  }
}

export function bumpWidget(name: string) {
  const t = read();
  t.widgets[name] = (t.widgets[name] || 0) + 1;
  write(t);
}

export function getTelemetry() {
  return read();
}
