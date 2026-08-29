import type { Metadata } from "next";
import { NeutralWeatherPage } from "@/components/safety/neutral-weather";

export const metadata: Metadata = {
  title: { absolute: "Weather today" },
  description: "A simple saved local weather summary.",
};

export default function WeatherPage() {
  return <NeutralWeatherPage />;
}
