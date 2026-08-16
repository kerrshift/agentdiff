export interface TraceNode {
  id: string;
  label: string;
  type: "start" | "tool" | "synthesis" | "error";
  status: "match" | "pruned" | "loop" | "added" | "default";
  cost: number;
  tokens: number;
  args?: string;
}

export interface Scenario {
  name: string;
  code: string;
  tdi: string;
  wei: string;
  costDelta: string;
  latencyDelta: string;
  status: "PASS" | "FAIL";
  nodes: TraceNode[];
  description: string;
  logs: string[];
}
