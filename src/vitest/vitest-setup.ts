import { vi } from "vitest";

vi.mock("socket.io-client", async () => {
  const actual = await vi.importActual("socket.io-client");
  return {
    ...actual,
    io: vi.fn(),
  };
});
