// The UI reads the same shapes the actions return.
type Result<N extends keyof AgentNativeActionRegistry> = AgentNativeActionRegistry[N]["result"];

export type Design = Result<"get-design">;
export type Budget = NonNullable<Result<"get-budget">>;
export type ChangeRow = Result<"list-changes">["changes"][number];
export type Change = NonNullable<ChangeRow["change"]>;
