import { Scenario } from "./types";

export const SCENARIOS: Scenario[] = [
  {
    name: "01. Path optimization",
    code: "ROUTE_OPT",
    tdi: "0.45",
    wei: "0.00",
    costDelta: "-62.5%",
    latencyDelta: "-1.8s",
    status: "PASS",
    description: "The candidate run reduces redundant database queries by caching database schema requests, shortening the execution graph.",
    nodes: [
      { id: "n1", label: "Agent start", type: "start", status: "match", cost: 0.0002, tokens: 120 },
      { id: "n2", label: "list_tables", type: "tool", status: "match", cost: 0.0005, tokens: 320 },
      { id: "n3", label: "read_schema", type: "tool", status: "pruned", cost: 0.0009, tokens: 480, args: "{ table: 'users' }" },
      { id: "n4", label: "read_schema", type: "tool", status: "pruned", cost: 0.0009, tokens: 480, args: "{ table: 'orders' }" },
      { id: "n5", label: "execute_sql", type: "tool", status: "match", cost: 0.0015, tokens: 600, args: "SELECT * FROM orders LIMIT 10;" },
      { id: "n6", label: "Synthesize", type: "synthesis", status: "match", cost: 0.0008, tokens: 400 }
    ],
    logs: [
      "Ingesting baseline trace: sql_agent_v1.json [6 steps]",
      "Ingesting candidate trace: sql_agent_v2.json [4 steps]",
      "Aligning execution graphs using topological matching...",
      "Pruned 2 redundant steps detected in candidate trace",
      "Computing divergence index: TDI = 0.45 (structural difference)",
      "Calculating wasted effort: WEI = 0.00 (efficient path)",
      "Cost reduction computed: -62.5% USD | Latency savings: -1.8s",
      "Integrity verification complete: Final output matches baseline [PASS]"
    ]
  },
  {
    name: "02. Cyclical loop detected",
    code: "CYCLE_LOOP",
    tdi: "0.15",
    wei: "0.57",
    costDelta: "+148.2%",
    latencyDelta: "+5.4s",
    status: "FAIL",
    description: "The agent enters an infinite loop trying to access an invalid database column name, querying the schema repeatedly without updating arguments.",
    nodes: [
      { id: "n1", label: "Agent start", type: "start", status: "match", cost: 0.0002, tokens: 120 },
      { id: "n2", label: "execute_sql", type: "tool", status: "match", cost: 0.0012, tokens: 450, args: "SELECT name FROM users;" },
      { id: "n3", label: "sql_error", type: "error", status: "loop", cost: 0.0005, tokens: 200, args: "Column 'name' does not exist." },
      { id: "n4", label: "execute_sql", type: "tool", status: "loop", cost: 0.0012, tokens: 450, args: "SELECT name FROM users;" },
      { id: "n5", label: "sql_error", type: "error", status: "loop", cost: 0.0005, tokens: 200, args: "Column 'name' does not exist." },
      { id: "n6", label: "Synthesize", type: "synthesis", status: "match", cost: 0.0008, tokens: 400 }
    ],
    logs: [
      "Ingesting baseline trace: sql_agent_v1.json [4 steps]",
      "Ingesting candidate trace: sql_agent_loop.json [8 steps]",
      "Warning: Cyclical invocation pattern detected in candidate graph",
      "Loop sequence identified: execute_sql -> sql_error [Iterations: 3]",
      "Argument drift analysis: 0.00 (Arguments are completely identical)",
      "Computing divergence index: TDI = 0.15",
      "Critical threshold exceeded: Wasted effort index is too high [WEI: 0.57 > 0.15]",
      "Evaluation criteria failed: Cost increased by 148.2% [FAIL]"
    ]
  },
  {
    name: "03. Error recovery drift",
    code: "ERR_RECOV",
    tdi: "0.33",
    wei: "0.20",
    costDelta: "+18.4%",
    latencyDelta: "+0.9s",
    status: "PASS",
    description: "The candidate run successfully recovers from a database access permission error in one step using an alternative index, avoiding total crash.",
    nodes: [
      { id: "n1", label: "Agent start", type: "start", status: "match", cost: 0.0002, tokens: 120 },
      { id: "n2", label: "get_users", type: "tool", status: "match", cost: 0.0010, tokens: 350 },
      { id: "n3", label: "permission_error", type: "error", status: "match", cost: 0.0004, tokens: 180 },
      { id: "n4", label: "get_users_fallback", type: "tool", status: "added", cost: 0.0012, tokens: 400, args: "{ use_public: true }" },
      { id: "n5", label: "Synthesize", type: "synthesis", status: "match", cost: 0.0008, tokens: 400 }
    ],
    logs: [
      "Ingesting baseline trace: baseline_fail.json [3 steps]",
      "Ingesting candidate trace: candidate_recovered.json [5 steps]",
      "Aligning execution graphs: Detected added fallback trajectory path",
      "Candidate initiated alternative routing: get_users_fallback",
      "Recovery status: Successful state divergence and correction",
      "Computing resilience metric: Candidate recovered in 1 step vs baseline crash",
      "Wasted effort index: WEI = 0.20 | Cost drift is within bounds (+18.4%)",
      "Evaluation criteria met successfully [PASS]"
    ]
  }
];
