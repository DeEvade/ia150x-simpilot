import { Server } from "socket.io"
import { FlightData } from "../interfaces"

class FlightDataStore {
  private static instance: FlightDataStore
  private flightDataMap: Map<string, FlightData>
  private io: Server

  public constructor(io: Server) {
    this.flightDataMap = new Map<string, FlightData>()
    this.io = io

    setTimeout(() => {
      this.flightDataMap.forEach((data, key) => {
        if (Date.now() - data.updatedAt > 20000) {
          this.deleteFlightData(key)
        }
      })
    }, 20000)

    FlightDataStore.instance = this
  }

  public static getInstance(): FlightDataStore {
    if (!FlightDataStore.instance) {
      throw new Error("FlightDataStore not initialized")
    }
    return FlightDataStore.instance
  }

  public getFlightData(key: string): FlightData | undefined {
    return this.flightDataMap.get(key)
  }

  public setFlightData(key: string, data: FlightData): void {
    data.updatedAt = Date.now()
    this.flightDataMap.set(key, data)
  }

  public deleteFlightData(key: string): void {
    this.flightDataMap.delete(key)
  }

  public getAllFlightData(): Map<string, FlightData> {
    return this.flightDataMap
  }
}

export default FlightDataStore
