import { useEffect, useState } from "react"
import { getFlightData } from "../apiUtils"

export interface FlightData {
  callsign: string
  lat: number //rad
  lon: number //rad
  alt: number //meter
  hdg: number //rad
  mach: number
  updatedAt: number
}
export const FlightInfo = () => {
  const [flightData, setFlightData] = useState<FlightData[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  useEffect(() => {
    const fetchFlightData = async () => {
      try {
        const data = await getFlightData()
        setFlightData(data)
      } catch (error) {
        console.error("Error fetching flight data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFlightData()
    const interval = setInterval(() => {
      fetchFlightData()
    }, 5000) // Fetch every 5 seconds
    return () => clearInterval(interval) // Cleanup interval on unmount
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!flightData) {
    return <div>No flight data available</div>
  }

  const filteredFlightData = flightData.filter((flight) => {
    return flight.callsign.toLowerCase().includes(searchTerm.toLowerCase())
  })

  return (
    <div style={{ height: "90vh", overflowY: "scroll" }}>
      <h2>Flight Data</h2>
      <input
        type="text"
        placeholder="Search by callsign"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <table>
        <thead>
          <tr>
            <th>Callsign</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Altitude (ft)</th>
            <th>Heading (deg)</th>
            <th>Mach</th>
          </tr>
        </thead>
        <tbody>
          {Array.from(filteredFlightData.entries())
          .map(([key, data]) => (
            <tr key={key}>
              <td>{data.callsign}</td>
              <td>{data.lat}</td>
              <td>{data.lon}</td>
              <td>{(data.alt * 3.28084).toFixed(0)}</td>
              <td>{((data.hdg * 180) / 3.141592).toFixed(0)}</td>
              <td>{data.mach.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
