import { vi } from "vitest";

export const mockSocketioClient = () => {
  // The consuming app should call this and create the mock in their own context
  vi.mock("socket.io-client", async () => {
    const actual = await vi.importActual("socket.io-client");
    return {
      ...actual,
      io: vi.fn(),
    };
  });
};
