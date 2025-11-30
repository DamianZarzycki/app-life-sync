import {
  Component,
  input,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportIframeRendererComponent } from '../report-iframe-renderer/report-iframe-renderer.component';
import { ReportDetailViewData } from '../../../../../types';

/**
 * ReportDetailContent
 * Presentational component displaying report metadata and content iframe.
 */
@Component({
  selector: 'app-report-detail-content',
  standalone: true,
  imports: [
    CommonModule,
    ReportIframeRendererComponent,
  ],
  templateUrl: './report-detail-content.component.html',
  styleUrls: ['./report-detail-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

})
export class ReportDetailContentComponent {
  readonly report = input.required<ReportDetailViewData>();

  constructor() {
    effect(() => {
      console.log(this.report());
    });
  }
}

