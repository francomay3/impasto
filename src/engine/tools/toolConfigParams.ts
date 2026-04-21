/**
 * Self-describing tool parameters for UI (e.g. Mantine Slider / NumberInput).
 * Add new `kind` variants here as tools grow.
 */

export type ToolConfigNumberParam = {
  readonly kind: 'number';
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  /** Display unit, e.g. pixels — viewports may ignore. */
  readonly unit: string;
};

export type ToolConfigChoiceOption = {
  readonly value: string;
  readonly label: string;
};

export type ToolConfigChoiceParam = {
  readonly kind: 'choice';
  readonly key: string;
  readonly label: string;
  readonly value: string;
  readonly options: readonly ToolConfigChoiceOption[];
};

export type ToolConfigParam = ToolConfigNumberParam | ToolConfigChoiceParam;

export type ImpastoToolUiConfig = {
  readonly params: readonly ToolConfigParam[];
};
