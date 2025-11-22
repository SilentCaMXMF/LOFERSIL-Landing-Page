#!/usr/bin/env node

/**
 * Production Health Check and Monitoring Script
 * Runs comprehensive checks on the deployed AI-powered GitHub Issues Reviewer System
 */

import https from 'https';
import { performance } from 'perf_hooks';

const BASE_URL = process.env.VERCEL_URL || 'https://lofersil.vercel.app';
const API_KEY = process.env.GITHUB_ISSUES_REVIEWER_API_KEY;

class HealthChecker {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async makeRequest(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${endpoint}`;
      const requestOptions = {
        headers: {
          'User-Agent': 'HealthChecker/1.0',
          ...options.headers,
        },
        ...options,
      };

      if (this.apiKey) {
        requestOptions.headers['x-api-key'] = this.apiKey;
      }

      const req = https.request(url, requestOptions, res => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const result = {
              status: res.statusCode,
              headers: res.headers,
              data: data ? JSON.parse(data) : null,
              responseTime: performance.now(),
            };
            resolve(result);
          } catch (error) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data,
              responseTime: performance.now(),
              parseError: error.message,
            });
          }
        });
      });

      req.on('error', error => {
        reject(error);
      });

      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  async checkHealth() {
    console.log('🏥 Checking system health...');

    try {
      const startTime = performance.now();
      const response = await this.makeRequest('/api/system/health');
      const totalTime = performance.now() - startTime;

      if (response.status === 200 && response.data?.overall === 'healthy') {
        console.log(`✅ Health check passed (${totalTime.toFixed(2)}ms)`);
        return { status: 'healthy', responseTime: totalTime, details: response.data };
      } else {
        console.log(`❌ Health check failed: ${response.status}`);
        return { status: 'unhealthy', responseTime: totalTime, details: response.data };
      }
    } catch (error) {
      console.log(`❌ Health check error: ${error.message}`);
      return { status: 'error', error: error.message };
    }
  }

  async checkApiEndpoints() {
    console.log('🔗 Checking API endpoints...');

    const endpoints = [
      { path: '/api/tasks/statistics', method: 'GET' },
      { path: '/api/tasks', method: 'GET' },
      { path: '/api/automation/triggers', method: 'GET' },
      { path: '/api/reports/completion', method: 'GET' },
    ];

    const results = {};

    for (const endpoint of endpoints) {
      try {
        const startTime = performance.now();
        const response = await this.makeRequest(endpoint.path, { method: endpoint.method });
        const totalTime = performance.now() - startTime;

        if (response.status === 200) {
          console.log(`✅ ${endpoint.path} - ${totalTime.toFixed(2)}ms`);
          results[endpoint.path] = { status: 'ok', responseTime: totalTime };
        } else {
          console.log(`❌ ${endpoint.path} - Status: ${response.status}`);
          results[endpoint.path] = { status: 'error', statusCode: response.status };
        }
      } catch (error) {
        console.log(`❌ ${endpoint.path} - Error: ${error.message}`);
        results[endpoint.path] = { status: 'error', error: error.message };
      }
    }

    return results;
  }

  async checkWebhookEndpoint() {
    console.log('🔗 Checking webhook endpoint...');

    try {
      // Test webhook endpoint with a mock payload
      const mockPayload = {
        action: 'ping',
        hook: { id: 123 },
        repository: { full_name: 'test/repo' },
      };

      const response = await this.makeRequest('/api/webhooks/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': 'ping',
          'X-GitHub-Delivery': 'test-delivery-' + Date.now(),
        },
        body: JSON.stringify(mockPayload),
      });

      if (response.status === 200) {
        console.log('✅ Webhook endpoint responding');
        return { status: 'ok', response: response.data };
      } else {
        console.log(`❌ Webhook endpoint error: ${response.status}`);
        return { status: 'error', statusCode: response.status };
      }
    } catch (error) {
      console.log(`❌ Webhook check failed: ${error.message}`);
      return { status: 'error', error: error.message };
    }
  }

  async checkStaticAssets() {
    console.log('📄 Checking static assets...');

    const assets = ['/', '/sitemap.xml', '/robots.txt', '/site.webmanifest'];

    const results = {};

    for (const asset of assets) {
      try {
        const response = await this.makeRequest(asset);

        if (response.status === 200) {
          console.log(`✅ ${asset} - OK`);
          results[asset] = { status: 'ok', statusCode: response.status };
        } else {
          console.log(`⚠️  ${asset} - Status: ${response.status}`);
          results[asset] = { status: 'warning', statusCode: response.status };
        }
      } catch (error) {
        console.log(`❌ ${asset} - Error: ${error.message}`);
        results[asset] = { status: 'error', error: error.message };
      }
    }

    return results;
  }

  async runFullCheck() {
    console.log('🚀 Starting comprehensive health check...\n');

    const results = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      checks: {},
    };

    // Health check
    results.checks.health = await this.checkHealth();

    // API endpoints
    results.checks.api = await this.checkApiEndpoints();

    // Webhook endpoint
    results.checks.webhook = await this.checkWebhookEndpoint();

    // Static assets
    results.checks.assets = await this.checkStaticAssets();

    // Summary
    console.log('\n📊 Health Check Summary:');
    console.log('='.repeat(50));

    const healthStatus = results.checks.health.status;
    const healthEmoji =
      healthStatus === 'healthy' ? '✅' : healthStatus === 'unhealthy' ? '❌' : '⚠️';
    console.log(`${healthEmoji} System Health: ${healthStatus}`);

    const apiResults = Object.values(results.checks.api);
    const apiOk = apiResults.filter(r => r.status === 'ok').length;
    const apiTotal = apiResults.length;
    console.log(`🔗 API Endpoints: ${apiOk}/${apiTotal} OK`);

    const webhookStatus = results.checks.webhook.status;
    const webhookEmoji = webhookStatus === 'ok' ? '✅' : '❌';
    console.log(`${webhookEmoji} Webhook Endpoint: ${webhookStatus}`);

    const assetResults = Object.values(results.checks.assets);
    const assetsOk = assetResults.filter(r => r.status === 'ok').length;
    const assetsTotal = assetResults.length;
    console.log(`📄 Static Assets: ${assetsOk}/${assetsTotal} OK`);

    // Overall status
    const allChecks = [
      results.checks.health.status === 'healthy',
      apiOk === apiTotal,
      webhookStatus === 'ok',
      assetsOk === assetsTotal,
    ];

    const overallStatus = allChecks.every(Boolean)
      ? '✅ ALL SYSTEMS OPERATIONAL'
      : allChecks.filter(Boolean).length >= 3
        ? '⚠️ MOSTLY OPERATIONAL'
        : '❌ SYSTEM ISSUES DETECTED';

    console.log(`\n🎯 Overall Status: ${overallStatus}`);

    return results;
  }
}

// CLI interface
async function main() {
  const checker = new HealthChecker(BASE_URL, API_KEY);

  try {
    const results = await checker.runFullCheck();

    // Exit with appropriate code
    const isHealthy = results.checks.health.status === 'healthy';
    process.exit(isHealthy ? 0 : 1);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  }
}

// Export for use as module
export { HealthChecker };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
