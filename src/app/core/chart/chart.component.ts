import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, Renderer2, ViewChild } from '@angular/core';
import Chart, { ChartDataset } from 'chart.js/auto';
import annotationPlugin, { AnnotationOptions, AnnotationTypeRegistry } from 'chartjs-plugin-annotation';
import { AppComponent } from '../app/app.component';
import { IChartDataBorder } from 'src/app/interfaces/chart.interface';

/**
 * The chart component. It'e a pie chart with annotations
 */
@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './chart.component.scss'
})
export class ChartComponent implements AfterViewInit {

  /**
   * The canvas element. It's used to draw the chart
   */
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  /**
   * Input - The full screen mode
   */
  @Input() fullScreen: boolean = false;

  /**
   * The number of sectors for the chart
   */
  private nbSectors: number = AppComponent.nbSectors;

  /**
   * The default background color for the chart
   */
  public static defaultBorderColor: string = 'rgb(211, 211, 211)';

  /**
   * The default selected border color for the chart
   */
  public static defaultSelectedBorderColor: string = 'rgb(255, 0, 0)';

  /**
   * The default border width for the chart
   */
  public static defaultBorderWidth: number = 1;

  /**
   * The default border dash for the chart
   */
  public static defaultBorderDash: number[] = [0, 0];

  /**
   * The default selected border width for the chart
   */
  public static defaultSelectedBorderWidth: number = 4;

  /**
   * The default color for the chart, if no color is provided
   */
  private static defaultBackgroundColor: string = AppComponent.intervalsColors[0].color;

  /**
   * The radius of the simulation
   */
  private radius: number = AppComponent.radius;

  /**
   * The zoom ratio of the chart. By default, it's 1 (100%)
   */
  private zoomRatio: number = 1;

  /**
   * The number of quarters for the chart
   */
  public nbQuarters: number = AppComponent.nbQuarters;

  /**
   * The steps values for the chart. It's an array of intervals (min, max)
   * The min and max are the distance range of the sector (in meters)
   * The length of the array is equal to the number of quarters
   * and the max value is equal to the radius of the simulation
   */
  public stepsValues: { min: number, max: number }[] = [];

  /**
   * The canvas context. It's used to draw the chart
   */
  public canvasContext!: CanvasRenderingContext2D | null;

  /**
   * The chart instance (from Chart.js)
   */
  public chart: Chart<'pie'> | undefined = undefined;

  /**
   * Constructor of the chart component
   * @param cdr Injected - The change detector reference
   * @param renderer Injected - The renderer
   */
  constructor(private cdr: ChangeDetectorRef, private renderer: Renderer2) {
    // Register the annotation plugin
    Chart.register(annotationPlugin);
  }

  /**
   * This is Angular lifecycle hook. It's called after the view is initialized
   */
  public ngAfterViewInit(): void {
    this.canvasContext = this.chartCanvas.nativeElement.getContext('2d');
    this.initChart();
  }

  /**
   * Hook called when the window is resized
   */
  public onResize(): void {
    this.chart!.resize(600, 600);
  }

  /**
   * Update the radius of the chart
   * @param radius the radius (in meters)
   * @returns void
   */
  public updateRadius(radius: number): void {
    this.radius = radius;
    this.updateAnnotations();
  }

  /**
   * Update the zoom of the chart
   * @param zoom the zoom (in percentage)
   * @returns void
   */
  public updateZoom(zoom: number): void {
    // We divide by 100 because the zoom is in percentage, and we want to have a ratio
    this.zoomRatio = 1 / (zoom / 100);
    this.updateAnnotations();
  }

  /**
   * Update the number of quarters of the chart
   * @param nbQuarters the number of sectors
   * @returns void
   */
  public updateNbQuarters(nbQuarters: number): void {
    this.nbQuarters = nbQuarters;
    this.updateAnnotations();
  }

  /**
   * Update the annotations of the chart
   * Also, update the datasets of the chart
   * @returns void
   */
  private updateAnnotations(): void {
    if (this.chart) {
      if (this.chart.options.plugins && this.chart.options.plugins.annotation) {
        this.chart.options.plugins!.annotation!.annotations = this.getAnnotations();
        this.updateDatasets(this.getChartDatasets());
      }
    }
  }

  /**
   * Update the datasets of the chart
   * @param datasets the datasets
   * @returns void
   */
  public updateDatasets(datasets: ChartDataset<'pie'>[]): void {
    if (this.chart) {
      this.chart.data.datasets = datasets;
      this.updateChart();
    }
  }

  /**
   * Update the chart
   * @returns void
   */
  public updateChart(): void {
    this.chart!.update();
  }

  /**
   * Get the datasets of the chart
   * @returns the datasets
   */
  public getDatasets(): ChartDataset<'pie'>[] {
    return this.chart ? this.chart.data.datasets : [];
  }

  /**
   * Update the number of sectors of the chart
   * If the number of sectors is updated, we also need to update the annotations
   * @param nbSectors  the number of sectors
   */
  public updateNbSectors(nbSectors: number): void {
    const chart = this.chart;
    this.nbSectors = nbSectors;
    if (chart && chart.options.scales && chart.options.scales['y']) {
      chart.options.scales['y'].min = this.nbSectors * -1;
      chart.options.scales['y'].max = this.nbSectors;
      this.updateAnnotations();
    }
  }

  /**
   * Toggle the full screen mode
   * @returns void
   */
  public toggleFullScreen(): void {
    if (this.fullScreen) {
      this.renderer.removeClass(document.body, 'modal-open');
      this.fullScreen = false;
    } else {
      this.renderer.addClass(document.body, 'modal-open');
      this.fullScreen = true;
    }
  }

  /**
   * Get the chart datasets; the chart datasets are
   * the series of the chart, with the data and the colors
   * @returns the chart datasets
   */
  private getChartDatasets(): ChartDataset<'pie'>[] {
    const series: ChartDataset<'pie'>[] = [];
    const sectorSize: number = this.radius / this.nbSectors;
    for (let i = 0; i < Math.round(this.nbSectors); i++) {
      const data: { data: number[], colors: string[] } = this.generatePlaceholderChartData();
      const minDistanceOfSector: number = Math.round((sectorSize * (this.nbSectors - i - 1)) * this.zoomRatio);
      const maxDistanceOfSector: number = Math.round((sectorSize * (this.nbSectors - i)) * this.zoomRatio);
      this.stepsValues[i] = { min: minDistanceOfSector, max: maxDistanceOfSector };
      series.push({ data: data.data, backgroundColor: data.colors, borderWidth: ChartComponent.defaultBorderWidth, borderDash: ChartComponent.defaultBorderDash, borderColor: ChartComponent.defaultBorderColor });
    }
    return series;
  }

  /**
   * Generate an initial chart series (data and colors)
   * based on the number of quarters  with equals values
   * @returns the data and the colors
   */
  private generatePlaceholderChartData(): { data: number[], colors: string[] } {
    const placeholdersData: number[] = [];
    const placeholderColors: string[] = [];
    for (let i = 0; i < this.nbQuarters; i++) {
      const color: string = ChartComponent.defaultBackgroundColor;
      placeholdersData.push(1);
      placeholderColors.push(color);
    }
    return { data: placeholdersData, colors: placeholderColors };
  }

  /**
   * Calculate the font size for the annotations.
   * The font size is calculated based on the number of sectors.
   * The minimum font size is 7 and the maximum font size is 17.
   * @param nbSectors the number of sectors
   * @returns the font size
   */
  private calculateFontSize(nbSectors: number): number {
    const minFontSize = 7; // Minimum font size
    const maxFontSize = 17; // Maximum font size
    const baseFontSize = 10; // Base font size for 7 sectors
    // Calculate the difference relative to the base size (7 sectors)
    const sectorsDiff = 7 - nbSectors; // Inversion here
    // Calculate the font size delta
    const deltaFontSize = sectorsDiff * 0.5;
    // Calculate the adjusted font size and limit the font size between the minimum and maximum bounds
    return Math.max(minFontSize, Math.min(maxFontSize, (baseFontSize + deltaFontSize)));
  }

  /**
   * Get the dashed sectors lines for the chart
   * @returns the dashed sectors lines
   */
  private getDashedSectorsLines(): Partial<AnnotationOptions<keyof AnnotationTypeRegistry>>[] {
    if (!this.nbQuarters || this.nbQuarters < 2) {
      return [];
    }
    const annotations: Partial<AnnotationOptions<keyof AnnotationTypeRegistry>>[] = [];
    const angleStep = (2 * Math.PI) / this.nbQuarters;
    const initialAngle = Math.PI / 2;
    // Draw the dashed sectors lines
    for (let i = 0; i < this.nbQuarters; i++) {
      const angle = initialAngle + i * angleStep;
      const xMax = Math.cos(angle) * 0.5 + 0.5;
      const yMax = Math.sin(angle) * this.nbSectors;
      annotations.push({
        type: 'line',
        yMin: 0,
        yMax,
        xMin: .5,
        xMax,
        borderColor: '#969696',
        borderWidth: 2,
        borderDash: [4, 2]
      });
    }
    return annotations;
  }

  /**
   * Update the border of the datasets
   * The border is the color, the width and the dash of the border
   * @param border the border
   * @returns void
   */
  public updateBorderDatasets(border: IChartDataBorder[]): void {
    if (this.chart) {
      this.chart.data.datasets.forEach((dataset, index) => {
        dataset.borderColor = border[index + 1].borderColor;
        dataset.borderWidth = border[index + 1].borderWidth;
        dataset.borderDash = border[index + 1].borderDash;
      });
      this.updateChart();
    }
  }

  /**
   * Reset the border of the datasets
   * @returns void
   */
  public resetBorderDatasets(): void {
    if (this.chart) {
      this.chart.data.datasets = this.getChartDatasets();
      this.updateChart();
    }
  }

  /**
   * Get dynamics annotations for the chart
   * @returns the annotations
   */
  private getAnnotations(): Partial<AnnotationOptions<keyof AnnotationTypeRegistry>>[] {
    const annotations: Partial<AnnotationOptions<keyof AnnotationTypeRegistry>>[] = this.getDashedSectorsLines();
    const radiusBySectors: number = this.radius / this.nbSectors;
    const fontsize: number = this.calculateFontSize(this.nbSectors);

    // Draw the annotations labels for the axis
    for (let i = 0; i < this.nbSectors; i++) {
      const xValueTop: number = 0.5;
      const yValueTop: number = i + 1;
      const yValueBottom: number = -this.nbSectors + i;
      const xValueLeft: number = 0.5 * (1 - (i + 1) / this.nbSectors);
      const xValueRight: number = 0.5 + 0.5 * (i + 1) / this.nbSectors;
      const contentTop: string = (Math.round((radiusBySectors * yValueTop) * this.zoomRatio)).toString();
      const contentBottom: string = (Math.round((radiusBySectors * -yValueBottom) * this.zoomRatio)).toString();
      const contentSide: string = (Math.round((radiusBySectors * (i + 1)) * this.zoomRatio)).toString();
      const commonProperties: Partial<AnnotationOptions<'label'>> = {
        type: 'label',
        padding: 1,
        backgroundColor: 'white',
        font: { size: fontsize }
      };
      annotations.push(
        {
          id: `top-${i}`,
          ...commonProperties,
          xValue: xValueTop,
          yValue: yValueTop,
          yAdjust: 6,
          content: [contentTop]
        },
        {
          id: `bottom-${i}`,
          ...commonProperties,
          xValue: xValueTop,
          yValue: yValueBottom,
          yAdjust: -6,
          content: ["-" + contentBottom]
        },
        {
          id: `left-${i}`,
          ...commonProperties,
          xValue: xValueLeft,
          xAdjust: 6,
          rotation: -90,
          yValue: 0,
          content: ["-" + contentSide]
        },
        {
          id: `right-${i}`,
          ...commonProperties,
          xValue: xValueRight,
          xAdjust: -6,
          rotation: 90,
          yValue: 0,
          content: [contentSide]
        }
      );
    }
    return annotations;
  }

  /**
   * Initialize the chart, based on the canvas context
   * (Options and data are set here)
   * @returns void
   */
  public initChart(): void {
    if (this.canvasContext) {
      this.chart = new Chart<'pie'>(this.canvasContext, {
        type: 'pie',
        options: {
          responsive: true,
          aspectRatio: 1,
          scales: {
            x: {
              display: false,
            },
            y: {
              display: false,
              min: this.nbSectors * -1,
              max: this.nbSectors
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: false
            },
            annotation: {
              annotations: this.getAnnotations(),
              clip: false,
              common: {
                drawTime: 'afterDraw'
              }
            }
          },
          animation: false
        },
        data: {
          datasets: this.getChartDatasets(),
        }
      });
      this.chart.resize(600, 600);
    }
    this.cdr.detectChanges();
  }

}
