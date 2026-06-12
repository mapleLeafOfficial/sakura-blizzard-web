///
// (en) A min..max range with a random sampler. 1:1 port of util_simple_3d's VRange.
// (ja) min..max の範囲と乱数サンプラ。util_simple_3d の VRange から移植。
///
// 1:1 port of: util_simple_3d VRange
export class VRange {
  constructor(
    public min: number,
    public max: number,
  ) {}

  /// Returns a random value in [min, max). (Dart: getRandomInRange)
  getRandomInRange(): number {
    return this.min + Math.random() * (this.max - this.min);
  }
}
