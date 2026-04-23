import { useSyncEnginePaletteResolver } from './useSyncEnginePaletteResolver';

/** Mount inside {@link ImpastoProjectProvider} so palette sync reads engine + project pigment settings. */
export function EnginePaletteResolverSync() {
  useSyncEnginePaletteResolver();
  return null;
}
