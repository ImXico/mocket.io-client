import { describe, expect, afterEach, vi, it } from "vitest";
import {
  MetricsDashboardClient,
  SystemMetrics,
  SystemAlert,
  SystemStatus,
} from "./metrics-dashboard-client";
import { itWithMockedIoContext } from "../src/runners/vitest.setup";

describe("MetricsDashboardClient", () => {
  let dashboardClient: MetricsDashboardClient;

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Connection", () => {
    itWithMockedIoContext(
      "should establish connection successfully",
      async ({ mockedSocketIo }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        mockedSocketIo.server.mockEmit("connect");

        expect(dashboardClient.isConnected).toBe(true);
      },
    );

    itWithMockedIoContext(
      "should handle disconnection",
      async ({ mockedSocketIo }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        mockedSocketIo.server.mockEmit("connect");
        expect(dashboardClient.isConnected).toBe(true);

        mockedSocketIo.server.mockEmit("disconnect");
        expect(dashboardClient.isConnected).toBe(false);
      },
    );
  });

  describe("Metrics subscription", () => {
    itWithMockedIoContext(
      "should acknowledge alerts",
      async ({ mockedSocketIo }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");
        mockedSocketIo.server.mockEmit("connect");

        const testAlert: SystemAlert = {
          id: "alert-123",
          timestamp: Date.now(),
          level: "warning",
          message: "High CPU usage detected",
          source: "system-monitor",
        };

        mockedSocketIo.server.mockEmit("alert", testAlert);
        expect(dashboardClient.alerts).toHaveLength(1);

        // Handle acknowledge event
        mockedSocketIo.server.mockOn(
          "acknowledge_alert",
          (alertId, callback) => {
            expect(alertId).toBe("alert-123");
            callback(true);
          },
        );

        const result = await dashboardClient.acknowledgeAlert("alert-123");

        expect(result).toBe(true);
        expect(dashboardClient.alerts).toHaveLength(0);
      },
    );

    itWithMockedIoContext(
      "should subscribe to metrics",
      async ({ mockedSocketIo }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");

        mockedSocketIo.server.mockEmit("connect");

        // Handle subscribe event from client
        mockedSocketIo.server.mockOn("subscribe", (metricTypes, callback) => {
          // Verify the client is sending the right metric types
          expect(metricTypes).toEqual(["cpu", "memory"]);

          // Call the callback with true to indicate successful subscription
          callback(true);
        });

        const result = await dashboardClient.subscribeToMetrics([
          "cpu",
          "memory",
        ]);

        expect(result).toBe(true);
        expect(dashboardClient.subscribedMetrics).toContain("cpu");
        expect(dashboardClient.subscribedMetrics).toContain("memory");
      },
    );

    itWithMockedIoContext(
      "should unsubscribe from metrics",
      async ({ mockedSocketIo }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");
        mockedSocketIo.server.mockEmit("connect");

        // Setup initial subscription
        mockedSocketIo.server.mockOn("subscribe", (metricTypes, callback) => {
          callback(true);
        });

        await dashboardClient.subscribeToMetrics([
          "cpu",
          "memory",
          "activeUsers",
        ]);

        // Handle unsubscribe event
        mockedSocketIo.server.mockOn("unsubscribe", (metricTypes, callback) => {
          expect(metricTypes).toEqual(["cpu"]);
          callback(true);
        });

        const result = await dashboardClient.unsubscribeFromMetrics(["cpu"]);

        expect(result).toBe(true);
        expect(dashboardClient.subscribedMetrics).not.toContain("cpu");
        expect(dashboardClient.subscribedMetrics).toContain("memory");
        expect(dashboardClient.subscribedMetrics).toContain("activeUsers");
      },
    );

    itWithMockedIoContext(
      "should receive metric updates from server",
      async ({ mockedSocketIo }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");
        mockedSocketIo.server.mockEmit("connect");

        const testMetrics: SystemMetrics = {
          timestamp: Date.now(),
          cpu: 45.5,
          memory: 68.3,
          activeUsers: 1250,
          responseTime: 120,
          errorRate: 0.05,
        };

        mockedSocketIo.server.mockEmit("metric_update", testMetrics);

        expect(dashboardClient.currentMetrics).toEqual(testMetrics);
      },
    );
  });

  describe("System status and alerts", () => {
    itWithMockedIoContext(
      "should handle status changes",
      async ({ mockedSocketIo }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");
        mockedSocketIo.server.mockEmit("connect");

        const newStatus: SystemStatus = "maintenance";
        mockedSocketIo.server.mockEmit("status_change", newStatus);

        expect(dashboardClient.systemStatus).toBe(newStatus);
      },
    );

    itWithMockedIoContext(
      "should receive and store alerts",
      async ({ mockedSocketIo }) => {
        dashboardClient = new MetricsDashboardClient("http://localhost:9999");
        mockedSocketIo.server.mockEmit("connect");

        const testAlert: SystemAlert = {
          id: "alert-123",
          timestamp: Date.now(),
          level: "warning",
          message: "High CPU usage detected",
          source: "system-monitor",
        };

        mockedSocketIo.server.mockEmit("alert", testAlert);

        expect(dashboardClient.alerts).toHaveLength(1);
        expect(dashboardClient.alerts[0]).toEqual(testAlert);
      },
    );

    // itWithMockedIoContext(
    //   "should acknowledge alerts",
    //   async ({ mockedSocketIo }) => {
    //     dashboardClient = new MetricsDashboardClient("http://localhost:9999");
    //     mockedSocketIo.server.mockEmit("connect");

    //     const testAlert: SystemAlert = {
    //       id: "alert-123",
    //       timestamp: Date.now(),
    //       level: "warning",
    //       message: "High CPU usage detected",
    //       source: "system-monitor",
    //     };

    //     mockedSocketIo.server.mockEmit("alert", testAlert);
    //     expect(dashboardClient.alerts).toHaveLength(1);

    //     // Handle acknowledge event
    //     mockedSocketIo.server.on("acknowledge_alert", (alertId, callback) => {
    //       expect(alertId).toBe("alert-123");
    //       callback(true);
    //     });

    //     const result = await dashboardClient.acknowledgeAlert("alert-123");

    //     expect(result).toBe(true);
    //     expect(dashboardClient.alerts).toHaveLength(0);
    //   },
    // );
  });

  // describe("Actions", () => {
  //   itWithMockedIoContext(
  //     "should request actions and handle results",
  //     async ({ mockedSocketIo }) => {
  //       dashboardClient = new MetricsDashboardClient("http://localhost:9999");
  //       mockedSocketIo.server.mockEmit("connect");

  //       const actionParams = { serviceId: "auth-service" };
  //       const actionResult = {
  //         status: "restarting",
  //         estimatedCompletionTime: "30s",
  //       };

  //       // Handle action request
  //       mockedSocketIo.server.on(
  //         "request_action",
  //         (actionType, params, callback) => {
  //           expect(actionType).toBe("restart_service");
  //           expect(params).toEqual(actionParams);
  //           callback(true, actionResult);
  //         },
  //       );

  //       const result = await dashboardClient.requestAction(
  //         "restart_service",
  //         actionParams,
  //       );

  //       expect(result).toEqual(actionResult);
  //     },
  //   );

  //   itWithMockedIoContext(
  //     "should handle failed actions",
  //     async ({ mockedSocketIo }) => {
  //       dashboardClient = new MetricsDashboardClient("http://localhost:9999");
  //       mockedSocketIo.server.mockEmit("connect");

  //       // Handle failed action
  //       mockedSocketIo.server.on(
  //         "request_action",
  //         (actionType, params, callback) => {
  //           callback(false);
  //         },
  //       );

  //       try {
  //         await dashboardClient.requestAction("clear_cache");
  //         // Should not reach here
  //         expect(true).toBe(false);
  //       } catch (error) {
  //         expect(error).toBeDefined();
  //       }
  //     },
  //   );
  // });
});
