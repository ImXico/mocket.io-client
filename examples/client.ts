import { io } from "socket.io-client";

export class LiveCounter {
  private _value = 0;
  private _lastAckFromServerAt: string | undefined = undefined;

  private readonly socketIoClient = io("http://localhost:8000");

  constructor() {
    console.log(">>>>>", this.socketIoClient);
    this.socketIoClient.on("connect", () => {
      console.log("--------- connecteeeeeed!!!!!!!");
      // this.socketIoClient.emit("ping", (ack: string) => {
      //   console.log("ack from server:", ack);
      // });
    });

    this.socketIoClient.on("increment", () => {
      console.log(this.socketIoClient);

      console.log("---->", this.socketIoClient);
      if (!this.socketIoClient.connected) {
        console.error("socket is noooot connected");
        return;
      }

      console.log("socket is connected, will increment...");
      this._value++;
    });

    this.socketIoClient.on("increment-and-report", () => {
      this._value++;
      this.socketIoClient.emit(
        "report",
        this.value,
        (receivedAtAck: string) => {
          this._lastAckFromServerAt = receivedAtAck;
        }
      );
    });
  }

  get lastAckFromServer() {
    return this._lastAckFromServerAt;
  }

  get value() {
    return this._value;
  }
}

// setTimeout(() => {
//   socketIoClient.emit("hello-from-client", "hello to you too!");
// }, 2000);
// const someClientSideCode = (...messages: string[]) => {
//   console.info("wohoooo", messages[0], messages[1]);
// };
