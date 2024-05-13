export interface ISettingsPanels {
  distribution: {
    rayon?: number;
    mobiles?: number;
    refresh?: number;
  };
  density: {
    sectors?: number;
    quarters?: number;
    distribution?: {
      0: string;
      1: string;
      2: string;
    };
  };
  video: number;
}