import { io, Socket } from "socket.io-client";

type ServerToClientEvents = {
  connect: () => void;
  disconnect: () => void;
  metric_update: (metrics: SystemMetrics) => void;
  alert: (alert: SystemAlert) => void;
  status_change: (status: SystemStatus) => void;
};

type ClientToServerEvents = {
  subscribe: (
    metricTypes: string[],
    callback: (success: boolean) => void,
  ) => void;
  unsubscribe: (
    metricTypes: string[],
    callback: (success: boolean) => void,
  ) => void;
  request_action: (
    actionType: ActionType,
    params: Record<string, any>,
    callback: (success: boolean, result?: any) => void,
  ) => void;
  acknowledge_alert: (
    alertId: string,
    callback: (success: boolean) => void,
  ) => void;
};

export type ActionType = "restart_service" | "clear_cache" | "run_maintenance";

export type SystemMetrics = {
  timestamp: number;
  cpu: number;
  memory: number;
  activeUsers: number;
  responseTime: number;
  errorRate: number;
};

export type SystemAlert = {
  id: string;
  timestamp: number;
  level: "info" | "warning" | "error" | "critical";
  message: string;
  source: string;
};

export type SystemStatus = "online" | "degraded" | "maintenance" | "offline";

export class MetricsDashboardClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  private _isConnected = false;
  private _currentMetrics: SystemMetrics | null = null;
  private _alerts: SystemAlert[] = [];
  private _systemStatus: SystemStatus = "offline";
  private _subscribedMetrics: string[] = [];

  constructor(serverUrl: string = "http://localhost:8000", options = {}) {
    this.socket = io(serverUrl, {
      autoConnect: false,
      reconnection: true,
      ...options,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.socket.on("connect", () => {
      this._isConnected = true;
      console.info(`Connected to monitoring server with ID: ${this.socket.id}`);
    });

    this.socket.on("disconnect", () => {
      this._isConnected = false;
      console.info("Disconnected from monitoring server");
    });

    this.socket.on("metric_update", (metrics) => {
      this._currentMetrics = metrics;
      console.info(
        `Received metrics update at ${new Date(metrics.timestamp).toISOString()}`,
      );
    });

    this.socket.on("alert", (alert) => {
      this._alerts.push(alert);
      console.info(`ALERT [${alert.level}]: ${alert.message}`);
    });

    this.socket.on("status_change", (status) => {
      this._systemStatus = status;
      console.info(`System status changed to: ${status}`);
    });
  }

  public connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this._isConnected) {
        resolve(true);
        return;
      }

      const onConnect = () => {
        this.socket.off("connect", onConnect);
        this.socket.off("connect_error", onConnectError);
        resolve(true);
      };

      const onConnectError = (err: Error) => {
        console.error("Connection error:", err);
        this.socket.off("connect", onConnect);
        this.socket.off("connect_error", onConnectError);
        resolve(false);
      };

      this.socket.once("connect", onConnect);
      this.socket.once("connect_error", onConnectError);
      this.socket.connect();
    });
  }

  public disconnect(): void {
    this.socket.disconnect();
  }

  public subscribeToMetrics(
    metricTypes: string[] = ["cpu", "memory", "activeUsers"],
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this._isConnected) {
        console.error("Not connected to server");
        return resolve(false);
      }

      this.socket.emit("subscribe", metricTypes, (success) => {
        console.info("inside callback of subscribe");
        if (success) {
          const combinedSet = new Set([
            ...this._subscribedMetrics,
            ...metricTypes,
          ]);
          this._subscribedMetrics = Array.from(combinedSet);

          console.info(this._subscribedMetrics);

          console.info(`Subscribed to: ${metricTypes.join(", ")}`);
        } else {
          console.error("Failed to subscribe to metrics");
        }
        return resolve(success);
      });
    });
  }

  public unsubscribeFromMetrics(metricTypes: string[]): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this._isConnected) {
        console.error("Not connected to server");
        resolve(false);
        return;
      }

      this.socket.emit("unsubscribe", metricTypes, (success) => {
        if (success) {
          this._subscribedMetrics = this._subscribedMetrics.filter(
            (m) => !metricTypes.includes(m),
          );
          console.info(`Unsubscribed from: ${metricTypes.join(", ")}`);
        } else {
          console.error("Failed to unsubscribe from metrics");
        }
        resolve(success);
      });
    });
  }

  public requestAction(
    actionType: ActionType,
    params: Record<string, any> = {},
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this._isConnected) {
        console.error("Not connected to server");
        reject(new Error("Not connected to server"));
        return;
      }

      this.socket.emit(
        "request_action",
        actionType,
        params,
        (success, result) => {
          if (success) {
            console.info(`Action ${actionType} completed successfully`);
            resolve(result);
          } else {
            console.error(`Action ${actionType} failed`);
            reject(new Error(`Action ${actionType} failed`));
          }
        },
      );
    });
  }

  public acknowledgeAlert(alertId: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this._isConnected) {
        console.error("Not connected to server");
        resolve(false);
        return;
      }

      this.socket.emit("acknowledge_alert", alertId, (success) => {
        if (success) {
          // Remove the alert from the list or mark as acknowledged
          this._alerts = this._alerts.filter((alert) => alert.id !== alertId);
          console.info(`Alert ${alertId} acknowledged`);
        } else {
          console.error(`Failed to acknowledge alert ${alertId}`);
        }
        resolve(success);
      });
    });
  }

  // Getters
  get isConnected(): boolean {
    return this._isConnected;
  }

  get currentMetrics(): SystemMetrics | null {
    return this._currentMetrics;
  }

  get alerts(): SystemAlert[] {
    return [...this._alerts];
  }

  get systemStatus(): SystemStatus {
    return this._systemStatus;
  }

  get subscribedMetrics(): string[] {
    return [...this._subscribedMetrics];
  }
}
