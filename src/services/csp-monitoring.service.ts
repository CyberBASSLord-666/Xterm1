import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LoggerService } from './logger.service';
import { PlatformService } from './platform.service';
import { AnalyticsService } from './analytics.service';

interface CspViolationPayload {
  blockedUri: string;
  violatedDirective: string;
  effectiveDirective: string;
  originalPolicy: string;
  sourceFile: string;
  lineNumber: number;
  columnNumber: number;
  disposition: string;
  referrer: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class CspMonitoringService {
  private readonly logger = inject(LoggerService);
  private readonly platformService = inject(PlatformService);
  private readonly analytics = inject(AnalyticsService);
  private readonly document = inject(DOCUMENT);
  private readonly fallbackEndpoint = '/api/csp-report';
  private isMonitoring = false;

  initialize(): void {
    if (!this.platformService.isBrowser || this.isMonitoring) {
      return;
    }

    const doc = this.platformService.getDocument();
    if (!doc) {
      return;
    }

    this.platformService.addEventListener(doc, 'securitypolicyviolation', this.handleViolation);
    this.isMonitoring = true;
    this.logger.info('CSP monitoring initialized', { endpoint: this.getReportEndpoint() }, 'CspMonitoring');
  }

  private readonly handleViolation = (event: Event): void => {
    const violation = event as SecurityPolicyViolationEvent;
    const payload: CspViolationPayload = {
      blockedUri: violation.blockedURI || 'unknown',
      violatedDirective: violation.violatedDirective || 'unknown',
      effectiveDirective: violation.effectiveDirective || 'unknown',
      originalPolicy: violation.originalPolicy || 'unknown',
      sourceFile: violation.sourceFile || 'unknown',
      lineNumber: violation.lineNumber || 0,
      columnNumber: violation.columnNumber || 0,
      disposition: violation.disposition || 'enforce',
      referrer: violation.referrer || 'unknown',
      timestamp: new Date().toISOString(),
    };

    this.logger.warn('CSP violation detected', payload, 'CspMonitoring');
    this.analytics.trackEvent({
      name: 'csp_violation',
      category: 'security',
      action: 'csp_violation',
      label: payload.effectiveDirective,
      metadata: {
        blockedUri: payload.blockedUri,
        violatedDirective: payload.violatedDirective,
        sourceFile: payload.sourceFile,
      },
    });

    this.reportViolation(payload);
  };

  private reportViolation(payload: CspViolationPayload): void {
    const win = this.platformService.getWindow();
    if (!win) {
      return;
    }

    const endpoint = this.getReportEndpoint();
    const body = JSON.stringify({
      'csp-report': payload,
    });

    if (typeof win.navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/csp-report' });
      if (win.navigator.sendBeacon(endpoint, blob)) {
        return;
      }

      this.logger.warn(
        'sendBeacon could not queue CSP violation report; falling back to fetch',
        { endpoint },
        'CspMonitoring'
      );
    }

    void fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/csp-report' },
      body,
      keepalive: true,
    }).catch((error) => {
      this.logger.warn('Failed to send CSP violation report', error, 'CspMonitoring');
    });
  }

  private getReportEndpoint(): string {
    const meta = this.document.querySelector('meta[name="csp-report-endpoint"]');
    return meta?.getAttribute('content')?.trim() || this.fallbackEndpoint;
  }
}
