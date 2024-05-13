/**
 * A utility class for math operations
 * @class MathUtils
 * @classdesc A utility class for math operations
 * @export MathUtils
 */
export abstract class MathUtils {

  /**
   * The number of degrees in a radian
   */
  public static readonly DEGREES_IN_RADIAN: number = 180 / Math.PI;

  /**
   * Conversion factor from degrees to radians
   */
  public static readonly DEGREES_TO_RADIANS_CONVERSION_FACTOR: number = Math.PI / 180;

  /**
   * 90 degrees in radians
   */
  public static readonly DEGREES_90_IN_RADIANS: number = 90 * MathUtils.DEGREES_TO_RADIANS_CONVERSION_FACTOR;


  /**
   * Calculate the angle in degrees from the origin (0, 0)
   * to a point (x, y) in a 2D space
   * @param x the cartesian x-coordinate
   * @param y the cartesian y-coordinate
   * @returns the angle in degrees
   */
  public static calculateAngleFromOriginInDegrees(x: number, y: number): number {
    return Math.atan2(y, x) * (this.DEGREES_IN_RADIAN);
  }

  /**
   * Calculate the euclidean distance from the origin (0, 0) in a 2D space
   * @param x the cartesian x-coordinate
   * @param y the cartesian y-coordinate
   * @returns the euclidean distance from the origin
   */
  public static calculateEuclideanDistanceFromOrigin(x: number, y: number): number {
    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
  }

  public static convertRadiansToDegrees(radians: number | undefined): number {
    if (radians) return radians * MathUtils.DEGREES_IN_RADIAN;
    else return 0;
  }

}
