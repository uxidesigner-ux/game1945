export interface StageDefinition {
  id: string;
  displayName: string;
  theme: string;
  /** Wave script id; spawner will resolve in a later step. */
  waveScriptId: string;
  bossId: string;
}
