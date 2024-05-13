import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ISitacMobile, ISitacSvgMobile } from 'src/app/interfaces/sitac-data.interface';
import { SitacService } from 'src/app/services/sitac.service';
import { ChartComponent } from '../chart/chart.component';
import { AppComponent } from '../app/app.component';
import { MathUtils } from 'src/app/utils/math-utils';
import { SitacBackendEventType } from 'src/app/types/sitac-backend-event.type';
import { IChartAreaData, IChartData, IChartDataBorder } from 'src/app/interfaces/chart.interface';

/**
 * The density chart component
 * It's a pie chart with a specific number of sectors
 * and colors based on the number of mobiles in the sectors
 */
@Component({
  selector: 'app-density-chart',
  templateUrl: './density-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './density-chart.component.scss',
})
export class DensityChartComponent implements AfterViewInit  {

  /**
   * The chart component
   */
  @ViewChild('myChart') chartComponent!: ChartComponent;

  /**
   * The event to update the border of the datasets
   * The event is emitted when a mobile is selected
   * because we want to highlight the sectors where the mobile is
   */
  @Output() public datasetUpdateBorderEvent: EventEmitter<IChartDataBorder[]> = new EventEmitter();

  /**
   * The flag to know if the chart is visible or not
   */
  @Input() isWatching: boolean = false;

  /**
   * The selected mobile id
   */
  private selectedMobileId: number | null = null;

  /**
   * Array of the distribution of mobiles colors based on the intervals
   * The min and max are the number of mobiles in the interval
   * The color is the color to apply regarding the current range
   */
  private intervalsColors: {min?: number, max?: number, color: string}[] = AppComponent.intervalsColors;

  /**
   * The maximum number of mobile 
   */
  private maxInterval: number = this.intervalsColors[this.intervalsColors.length - 1].min!;

  /**
   * The full screen mode. By default, it's false.
   */
  public fullScreen: boolean = false;

  /**
   * The size of an individual quarter in degrees.
   * It's calculated based on the number of sectors.
   * For example, if we have 4 quarters, the size will be 90 degrees.
   */
  private quarterSize: number = -1;

  /**
   * Constructor
   * @param sitacService Injected SitacService to get the mobiles
   */
  constructor(public sitacService: SitacService, private cdr: ChangeDetectorRef) { }

  /**
   * Initialize the chart with the mobiles
   * Register the events to update the chart
   */
  public ngAfterViewInit(): void {
    this.quarterSize = 360 / this.chartComponent.nbQuarters;

    this.sitacService.sitacMobilesUpdateEvent$.subscribe((eventType: SitacBackendEventType) => {
      if (!this.isWatching && eventType === 'MOBILES_UPDATED') return; // The chart is not visible, we don't update it
      const mobiles = [...this.sitacService.mobiles.filter((mobile) => (mobile as ISitacSvgMobile).isOutOfRange === false && (mobile as ISitacSvgMobile).isDisplayed === true )];
      this.updateDatasetsBackgroundColors(mobiles as ISitacMobile[]);
    });
  }

  /**
   * Update the zoom of the chart
   * @param zoom 
   */
  public updateZoom(zoom: number): void {
    this.chartComponent.updateZoom(zoom);
  }

  /**
   * Toggle the full screen mode
   * @returns void
   */
  public toggleFullScreen(): void {
    this.fullScreen = !this.fullScreen;
    this.chartComponent.toggleFullScreen();
    this.cdr.detectChanges();
  }

  /**
   * Update the background colors of the datasets
   * @param mobiles the mobiles
   * @returns void
   */
  private updateDatasetsBackgroundColors(mobiles: ISitacMobile[]): void {
    const borders: IChartDataBorder[] = [{ borderColor: [], borderWidth: [], borderDash: [] }];
    this.chartComponent.getDatasets().forEach((dataset, index) => {
      const data = this.generateChartDataset(mobiles, this.chartComponent.stepsValues[index].min, this.chartComponent.stepsValues[index].max);
      dataset.backgroundColor = data.backgroundColor.colors;
      dataset.borderColor = data.borders.borderColor;
      dataset.borderWidth = data.borders.borderWidth;
      dataset.borderDash = data.borders.borderDash;
      borders.push({ borderColor: data.borders.borderColor, borderWidth: data.borders.borderWidth, borderDash: data.borders.borderDash });
    });
    if (this.selectedMobileId !== null) this.datasetUpdateBorderEvent.emit(borders);
    this.chartComponent.updateChart();
  }

  /**
   * Get the corresponding interval color based on the number of mobiles in an interval
   * @param numberOfMobiles the number of mobiles in the interval
   * @returns the color for the interval
   */
  private getColorForInterval(numberOfMobiles: number): string {
    for (const interval of this.intervalsColors) {
      if ((interval.min === undefined || numberOfMobiles >= interval.min) &&
        (interval.max === undefined || numberOfMobiles <= interval.max)) {
        return interval.color;
      }
    }
    return '';
  }

  /**
   * Update the number of quarters in the chart
   * @param quarters the number of quarters
   * @returns void
   */
  public updateQuarters(quarters: number): void {
    this.quarterSize = 360 / quarters;
    this.chartComponent.updateNbQuarters(quarters);
  }

  /**
   * Update the distribution of the chart
   * @param distributions the distribution
   * @returns void
   */
  public updateDistributions(distributions: number[]): void {
    const lastInterval = this.intervalsColors[this.intervalsColors.length - 1];
    this.intervalsColors = distributions.map((value, index) => {
      return { min: index === 0 ? 0 : distributions[index - 1] + 1, max: value, color: this.intervalsColors[index].color };
    });
    this.intervalsColors.push({ min: distributions[distributions.length - 1] + 1, color: lastInterval.color });
    this.maxInterval = this.intervalsColors[this.intervalsColors.length - 1].min!;
  }

  /**
   * Select (or unselect) a mobile
   * @param mobileId the mobile id
   * @returns void
   */
  public selectMobile(mobileId: number): void {
    this.selectedMobileId = (mobileId === this.selectedMobileId) ? null : mobileId;
    if (this.selectedMobileId === null) {
      this.chartComponent.resetBorderDatasets();
    }
  }

  /**
   * Get the data for a specific area (number of mobiles and if the selected mobile is in the area)
   * @param mobiles the mobiles
   * @param min the minimum distance of the area
   * @param max the maximum distance of the area
   * @param indexQuarter the index of the quarter
   * @returns the data for the area
   */
  private getSpecificAreaData(mobiles: ISitacMobile[], min: number, max: number, indexQuarter: number): IChartAreaData {
    let numberOfMobiles: number = 0;
    const selectedMobileId: number | null = this.selectedMobileId;
    let hasSelectedMobile: boolean = false;
    let i: number = 0;
    while ((selectedMobileId !== null || numberOfMobiles <= this.maxInterval) && i < mobiles.length) {
      const mobile: ISitacMobile = mobiles[i];
      const mobileDistanceFromOrigin: number = MathUtils.calculateEuclideanDistanceFromOrigin(mobile.kinematics.xM, mobile.kinematics.yM);
      // We check if the mobile is in the interval
      if (mobileDistanceFromOrigin > min && mobileDistanceFromOrigin <= max) {
        const mobileAngleFromOrigin: number = MathUtils.calculateAngleFromOriginInDegrees(mobile.kinematics.xM, mobile.kinematics.yM);
        const angleWithin360: number = mobileAngleFromOrigin > 90 ? mobileAngleFromOrigin - 360 : mobileAngleFromOrigin;
        const sectorStartAngle: number = 90 - indexQuarter * this.quarterSize;
        // We check if the mobile is in the sector
        if (angleWithin360 < sectorStartAngle) {
          const sectorEndAngle: number = sectorStartAngle - this.quarterSize;
          if (angleWithin360 >= sectorEndAngle) {
            numberOfMobiles++;
            if (mobile.id === selectedMobileId) {
              hasSelectedMobile = true;
            }
            mobiles.splice(i, 1);
            i--;
          }
        }
      }
      i++;
    }
    return { numberOfMobiles, hasSelectedMobile };
  }

  /**
   * Generate the data for a serie (background colors and borders)
   * @param mobiles the mobiles
   * @param min the minimum distance of the serie
   * @param max the maximum distance of the serie
   * @returns the data for the serie
   */
  private generateChartDataset(mobiles: ISitacMobile[], min: number, max: number): IChartData {
    const data: number[] = [];
    const colors: string[] = [];
    const borders: IChartDataBorder = { borderColor: [], borderWidth: [], borderDash: [] };
    const nbQuarters: number = this.chartComponent.nbQuarters;
    for (let i = 0; i < nbQuarters; i++) {
      // Get the number of mobiles in the current interval
      const mobileZoneInfo: IChartAreaData = mobiles.length > 0 ? this.getSpecificAreaData(mobiles, min, max, i) : { numberOfMobiles: 0, hasSelectedMobile: false };
      // Depending on the number of mobiles, we get the color for the interval
      const color: string = this.getColorForInterval(mobileZoneInfo.numberOfMobiles);
      // The data is always 1, because we want to display an equal distribution of the chart
      data.push(1);
      colors.push(color);
      if (mobileZoneInfo.hasSelectedMobile) {
        borders.borderColor.push(ChartComponent.defaultSelectedBorderColor);
        borders.borderWidth.push(ChartComponent.defaultSelectedBorderWidth);
      } else {
        borders.borderColor.push(ChartComponent.defaultBorderColor);
        borders.borderWidth.push(ChartComponent.defaultBorderWidth);
      }
      borders.borderDash = ChartComponent.defaultBorderDash;
    }
    return { backgroundColor: { data, colors }, borders };
  }
}