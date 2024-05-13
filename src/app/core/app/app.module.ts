import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MatTableModule } from '@angular/material/table';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { BrandingComponent } from '../branding/branding.component';
import { CardComponent } from '../card/card.component';
import { TeamInfoComponent } from '../team-info/team-info.component';
import { TableComponent } from '../table/table.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TableVirtualScrollModule } from 'ng-table-virtual-scroll';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatSortModule } from '@angular/material/sort';
import { SettingsPanelsComponent } from '../settings-panels/settings-panels.component';
import { HttpClientModule } from '@angular/common/http';
import { ToastComponent } from '../toast/toast.component';
import { MobileDisplayComponent } from '../mobile-display/mobile-display.component';
import { VideoComponent } from '../video/video.component';
import { DensityChartComponent } from '../density-chart/density-chart.component';
import { ChartParametersComponent } from '../chart-parameters/chart-parameters.component';
import { ParseIntPipe } from "../../pipes/parse-int.pipe";
import { ChartComponent } from '../chart/chart.component';
import { MobileDetailComponent } from "../mobile-detail/mobile-detail.component";

@NgModule({
  declarations: [
    AppComponent,
    BrandingComponent,
    CardComponent,
    MobileDisplayComponent,
    TeamInfoComponent,
    TableComponent,
    SettingsPanelsComponent,
    ToastComponent,
    DensityChartComponent,
    ChartParametersComponent,
    VideoComponent,
    ChartComponent,
    MobileDetailComponent,
  ],
  providers: [],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatTableModule,
    BrowserAnimationsModule,
    MatFormFieldModule,
    MatInputModule,
    ScrollingModule,
    TableVirtualScrollModule,
    MatSelectModule,
    MatListModule,
    MatSortModule,
    HttpClientModule,
    ParseIntPipe,
    FormsModule,
  ]
})
export class AppModule { }
