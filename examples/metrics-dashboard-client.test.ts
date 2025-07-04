import { describe, expect, beforeEach, vi } from "vitest";
import {
  MetricsDashboardClient,
  SystemMetrics,
  SystemAlert,
} from "./metrics-dashboard-client";
import { itWithMocketioClient } from "../src/vitest/vitest-context";

describe("MetricsDashboardClient", () => {
  let dashboardClient: MetricsDashboardClient;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("Connection Management", () => {
    itWithMocketioClient(
      "should handle reconnections",
      async ({ mocketioClient }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        // First connect successfully
        mocketioClient.server.mockEmit("connect");
        await dashboardClient.connect();
        expect(dashboardClient.isConnected).toBe(true);

        // Then disconnect
        mocketioClient.server.mockEmit("disconnect");
        expect(dashboardClient.isConnected).toBe(false);

        // Then reconnect
        mocketioClient.server.mockEmit("connect");
        await dashboardClient.connect();
        expect(dashboardClient.isConnected).toBe(true);
      },
    );

    itWithMocketioClient(
      "should handle duplicate connect calls",
      async ({ mocketioClient }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        // Connect first time
        mocketioClient.server.mockEmit("connect");
        await dashboardClient.connect();

        // Track connection attempts
        const connectSpy = vi.spyOn(mocketioClient.client, "mockConnect");

        // Connect second time - should not trigger a new connection
        await dashboardClient.connect();

        expect(connectSpy).not.toHaveBeenCalled();
      },
    );
  });

  describe("Metric Subscription", () => {
    itWithMocketioClient(
      "should fail subscription when not connected",
      async ({ mocketioClient }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        // Don't connect, try to subscribe immediately
        const result = await dashboardClient.subscribeToMetrics([
          "cpu",
          "memory",
        ]);

        expect(result).toBe(false);
        expect(dashboardClient.subscribedMetrics).toEqual([]);
      },
    );

    itWithMocketioClient(
      "should handle subscription failures",
      async ({ mocketioClient }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        // Connect successfully
        mocketioClient.server.mockEmit("connect");
        await dashboardClient.connect();

        // Setup server to reject the subscription
        mocketioClient.server.mockOn("subscribe", (metricTypes, callback) => {
          callback(false); // Simulate failure
        });

        const result = await dashboardClient.subscribeToMetrics([
          "cpu",
          "memory",
        ]);

        expect(result).toBe(false);
        expect(dashboardClient.subscribedMetrics).toEqual([]);
      },
    );

    itWithMocketioClient(
      "should handle duplicate subscriptions gracefully",
      async ({ mocketioClient }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        // Connect successfully
        mocketioClient.server.mockEmit("connect");
        await dashboardClient.connect();

        // Setup server to accept subscriptions
        mocketioClient.server.mockOn("subscribe", (metricTypes, callback) => {
          callback(true);
        });

        // Subscribe first time
        await dashboardClient.subscribeToMetrics(["cpu"]);

        // Subscribe again with same metric
        await dashboardClient.subscribeToMetrics(["cpu", "memory"]);

        // Should contain both metrics without duplicates
        expect(dashboardClient.subscribedMetrics).toEqual(["cpu", "memory"]);
        expect(dashboardClient.subscribedMetrics.length).toBe(2);
      },
    );
  });

  describe("Metric Updates", () => {
    itWithMocketioClient(
      "should handle metric updates with partial data",
      async ({ mocketioClient }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        // Connect successfully
        mocketioClient.server.mockEmit("connect");
        await dashboardClient.connect();

        // Send a partial metric update
        const partialMetrics = {
          timestamp: Date.now(),
          cpu: 45,
          memory: 70,
          // Missing activeUsers, responseTime and errorRate
        } as SystemMetrics;

        mocketioClient.server.mockEmit("metric_update", partialMetrics);

        expect(dashboardClient.currentMetrics).toEqual(partialMetrics);
      },
    );

    itWithMocketioClient(
      "should handle rapid metric updates",
      async ({ mocketioClient }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        // Connect successfully
        mocketioClient.server.mockEmit("connect");
        await dashboardClient.connect();

        // Send multiple updates in quick succession
        const metrics1 = {
          timestamp: Date.now() - 2000,
          cpu: 20,
          memory: 40,
          activeUsers: 100,
          responseTime: 200,
          errorRate: 0.1,
        };

        const metrics2 = {
          timestamp: Date.now() - 1000,
          cpu: 30,
          memory: 50,
          activeUsers: 110,
          responseTime: 250,
          errorRate: 0.2,
        };

        const metrics3 = {
          timestamp: Date.now(),
          cpu: 40,
          memory: 60,
          activeUsers: 120,
          responseTime: 300,
          errorRate: 0.3,
        };

        mocketioClient.server.mockEmit("metric_update", metrics1);
        mocketioClient.server.mockEmit("metric_update", metrics2);
        mocketioClient.server.mockEmit("metric_update", metrics3);

        // Should have the latest metrics
        expect(dashboardClient.currentMetrics).toEqual(metrics3);
      },
    );
  });

  describe("Alert Management", () => {
    itWithMocketioClient(
      "should handle multiple alerts",
      async ({ mocketioClient }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        // Connect successfully
        mocketioClient.server.mockEmit("connect");
        await dashboardClient.connect();

        // Send multiple alerts
        const alert1: SystemAlert = {
          id: "alert-1",
          timestamp: Date.now() - 2000,
          level: "warning",
          message: "High CPU usage",
          source: "system-monitor",
        };

        const alert2: SystemAlert = {
          id: "alert-2",
          timestamp: Date.now() - 1000,
          level: "error",
          message: "Memory leak detected",
          source: "memory-monitor",
        };

        mocketioClient.server.mockEmit("alert", alert1);
        mocketioClient.server.mockEmit("alert", alert2);

        expect(dashboardClient.alerts).toHaveLength(2);
        expect(dashboardClient.alerts).toContainEqual(alert1);
        expect(dashboardClient.alerts).toContainEqual(alert2);
      },
    );

    itWithMocketioClient(
      "should handle acknowledgment failure",
      async ({ mocketioClient }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        // Connect successfully
        mocketioClient.server.mockEmit("connect");
        await dashboardClient.connect();

        // Add an alert
        const alert: SystemAlert = {
          id: "alert-123",
          timestamp: Date.now(),
          level: "warning",
          message: "High CPU usage",
          source: "system-monitor",
        };

        mocketioClient.server.mockEmit("alert", alert);
        expect(dashboardClient.alerts).toHaveLength(1);

        // Setup server to reject the acknowledgment
        mocketioClient.server.mockOn(
          "acknowledge_alert",
          (alertId, callback) => {
            expect(alertId).toBe("alert-123");
            callback(false);
          },
        );

        const result = await dashboardClient.acknowledgeAlert("alert-123");

        expect(result).toBe(false);
        // Alert should still be in the list
        expect(dashboardClient.alerts).toHaveLength(1);
      },
    );

    itWithMocketioClient(
      "should not fail when acknowledging non-existent alert",
      async ({ mocketioClient }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        // Connect successfully
        mocketioClient.server.mockEmit("connect");
        await dashboardClient.connect();

        // Setup server to accept the acknowledgment
        mocketioClient.server.mockOn(
          "acknowledge_alert",
          (alertId, callback) => {
            callback(true);
          },
        );

        // Try to acknowledge an alert that doesn't exist
        const result =
          await dashboardClient.acknowledgeAlert("non-existent-alert");

        expect(result).toBe(true);
      },
    );
  });

  describe("Action Requests", () => {
    itWithMocketioClient(
      "should handle action success with result",
      async ({ mocketioClient }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        // Connect successfully
        mocketioClient.server.mockEmit("connect");
        await dashboardClient.connect();

        // Setup server to handle the action
        mocketioClient.server.mockOn(
          "request_action",
          (actionType, params, callback) => {
            expect(actionType).toBe("restart_service");
            expect(params).toEqual({ serviceName: "api-server" });
            callback(true, { restartTime: "2023-06-30T12:00:00Z" });
          },
        );

        const result = await dashboardClient.requestAction("restart_service", {
          serviceName: "api-server",
        });

        expect(result).toEqual({ restartTime: "2023-06-30T12:00:00Z" });
      },
    );

    itWithMocketioClient(
      "should handle action failure",
      async ({ mocketioClient }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        // Connect successfully
        mocketioClient.server.mockEmit("connect");
        await dashboardClient.connect();

        // Setup server to handle the action with failure
        mocketioClient.server.mockOn(
          "request_action",
          (actionType, params, callback) => {
            callback(false);
          },
        );

        await expect(
          dashboardClient.requestAction("clear_cache"),
        ).rejects.toThrow("Action clear_cache failed");
      },
    );

    itWithMocketioClient(
      "should fail action request when not connected",
      async ({ mocketioClient }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        // Do not connect

        await expect(
          dashboardClient.requestAction("run_maintenance"),
        ).rejects.toThrow("Not connected to server");
      },
    );
  });

  describe("System Status Updates", () => {
    itWithMocketioClient(
      "should handle status changes",
      async ({ mocketioClient }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        // Connect successfully
        mocketioClient.server.mockEmit("connect");
        await dashboardClient.connect();

        // Default status should be offline
        expect(dashboardClient.systemStatus).toBe("offline");

        // Send status updates
        mocketioClient.server.mockEmit("status_change", "online");
        expect(dashboardClient.systemStatus).toBe("online");

        mocketioClient.server.mockEmit("status_change", "degraded");
        expect(dashboardClient.systemStatus).toBe("degraded");

        mocketioClient.server.mockEmit("status_change", "maintenance");
        expect(dashboardClient.systemStatus).toBe("maintenance");
      },
    );
  });

  describe("Unsubscribe from Metrics", () => {
    itWithMocketioClient(
      "should handle unsubscribe correctly",
      async ({ mocketioClient }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        // Connect successfully
        mocketioClient.server.mockEmit("connect");
        await dashboardClient.connect();

        // Setup subscriptions
        mocketioClient.server.mockOn("subscribe", (metricTypes, callback) => {
          callback(true);
        });

        await dashboardClient.subscribeToMetrics([
          "cpu",
          "memory",
          "activeUsers",
        ]);
        expect(dashboardClient.subscribedMetrics).toEqual([
          "cpu",
          "memory",
          "activeUsers",
        ]);

        // Setup unsubscribe
        mocketioClient.server.mockOn("unsubscribe", (metricTypes, callback) => {
          expect(metricTypes).toEqual(["cpu"]);
          callback(true);
        });

        const result = await dashboardClient.unsubscribeFromMetrics(["cpu"]);

        expect(result).toBe(true);
        expect(dashboardClient.subscribedMetrics).toEqual([
          "memory",
          "activeUsers",
        ]);
      },
    );

    itWithMocketioClient(
      "should handle unsubscribe failure",
      async ({ mocketioClient }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        // Connect successfully
        mocketioClient.server.mockEmit("connect");
        await dashboardClient.connect();

        // Setup subscriptions
        mocketioClient.server.mockOn("subscribe", (metricTypes, callback) => {
          callback(true);
        });

        await dashboardClient.subscribeToMetrics(["cpu", "memory"]);

        // Setup unsubscribe to fail
        mocketioClient.server.mockOn("unsubscribe", (metricTypes, callback) => {
          callback(false);
        });

        const result = await dashboardClient.unsubscribeFromMetrics(["cpu"]);

        expect(result).toBe(false);
        // Subscribed metrics should remain unchanged
        expect(dashboardClient.subscribedMetrics).toEqual(["cpu", "memory"]);
      },
    );

    itWithMocketioClient(
      "should handle unsubscribe when not connected",
      async ({ mocketioClient }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        // Don't connect

        const result = await dashboardClient.unsubscribeFromMetrics(["cpu"]);

        expect(result).toBe(false);
      },
    );
  });
});
