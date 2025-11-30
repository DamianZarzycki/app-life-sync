import {
  Component,
  input,
  ChangeDetectionStrategy,
  inject,
  ViewChild,
  ElementRef,
  AfterViewInit,
  SecurityContext,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * ReportIframeRenderer
 * Presentational component that safely renders HTML content within a sandboxed iframe.
 * Handles security (XSS prevention) and accessibility requirements.
 */
@Component({
  selector: 'app-report-iframe-renderer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-iframe-renderer.component.html',
  styleUrls: ['./report-iframe-renderer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportIframeRendererComponent implements AfterViewInit {
  @ViewChild('iframe', { static: false }) iframeRef?: ElementRef<HTMLIFrameElement>;

  private readonly sanitizer = inject(DomSanitizer);

  readonly htmlContent = input.required<string>();
  readonly iframeTitle = input<string>('Report Content');

  ngAfterViewInit(): void {
    // Set iframe content after view initialization
    this.setIframeContent();
  }

  /**
   * Sets the iframe content safely using srcdoc attribute
   * This method writes HTML directly to the iframe without external URL loading
   */
  private setIframeContent(): void {
    if (!this.iframeRef?.nativeElement) {
      return;
    }

    const iframe = this.iframeRef!.nativeElement;
    const content = this.sanitizer.sanitize(SecurityContext.HTML, this.htmlContent());

    // Set iframe content with base styles for consistent rendering
    const wrappedContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
              line-height: 1.6;
              color: #333;
              padding: 20px;
              margin: 0;
              background-color: #fff;
            }
            h1, h2, h3, h4, h5, h6 {
              margin-top: 1.5em;
              margin-bottom: 0.5em;
            }
            p {
              margin-bottom: 1em;
            }
            a {
              color: #4f46e5;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
            code {
              background-color: #f3f4f6;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: 'Monaco', 'Courier New', monospace;
            }
            pre {
              background-color: #f3f4f6;
              padding: 1em;
              border-radius: 4px;
              overflow-x: auto;
            }
            blockquote {
              border-left: 4px solid #4f46e5;
              padding-left: 1em;
              margin-left: 0;
              color: #6b7280;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 1em;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 0.75em;
              text-align: left;
            }
            th {
              background-color: #f3f4f6;
              font-weight: 600;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;

    iframe.srcdoc = wrappedContent;
  }
}

