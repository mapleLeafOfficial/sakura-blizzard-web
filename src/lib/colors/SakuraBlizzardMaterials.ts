///
// (en) A set of materials used in SakuraBlizzard.
//      CSS color strings replace Flutter's Sp3dMaterial. RGB values are the
//      same as the source Color.fromARGB(...) literals.
// (ja) SakuraBlizzardで使用するマテリアルのセット。
//      Flutter の Sp3dMaterial を CSS 色文字列で置き換え。RGB 値はソース準拠。
///
// 1:1 port of: lib/src/colors/sakura_blizzard_materials.dart
// Stored as RGB numbers so the renderer can multiply by brightness per
// Sp3dLight.apply (RGB *= brightness), instead of using CSS alpha.
export interface Sp3dColor {
  r: number;
  g: number;
  b: number;
}

export const SakuraBlizzardMaterials = {
  /// Color.fromARGB(255, 254, 238, 237) — cherry-blossom petal pinkish white.
  sakura: { r: 254, g: 238, b: 237 } as Sp3dColor,
  /// Color.fromARGB(255, 255, 235, 59) — yellow.
  yellow: { r: 255, g: 235, b: 59 } as Sp3dColor,
};
