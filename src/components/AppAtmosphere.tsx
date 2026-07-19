import type { TabId } from "../types/app";
import type { FridgeThemeId } from "../types/theme";
import { getThemeAtmosphere } from "../data/themeAtmosphere";

interface AppAtmosphereProps {
  tab: TabId;
  themeId?: FridgeThemeId;
}

export function AppAtmosphere({ tab, themeId = "a" }: AppAtmosphereProps) {
  const { photo, position, photoStrength = 1 } = getThemeAtmosphere(themeId, tab);

  return (
    <div
      className="app-atmosphere"
      data-tab={tab}
      data-theme={themeId}
      aria-hidden
      style={{
        backgroundImage: photo ? `url(${photo})` : undefined,
        backgroundPosition: position,
        opacity: photoStrength,
      }}
    />
  );
}
