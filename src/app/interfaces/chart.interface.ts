export interface IChartData {
  backgroundColor: IChartDataBackground
  borders: IChartDataBorder
}

export interface IChartDataBackground {
  data: number[];
  colors: string[];
}

export interface IChartDataBorder {
  borderColor: string[];
  borderWidth: number[];
  borderDash: number[];
}

export interface IChartAreaData {
  numberOfMobiles: number,
  hasSelectedMobile: boolean
}