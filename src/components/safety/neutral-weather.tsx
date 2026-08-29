"use client";

import { Cloud, CloudSun, Droplets, Sun } from "lucide-react";
import { ClearEverythingAction } from "@/components/safety/clear-everything";

const forecast = [
  { day: "Today", condition: "Cloudy intervals", high: "29°", low: "22°", rain: "30%", icon: CloudSun },
  { day: "Tomorrow", condition: "Light cloud", high: "30°", low: "22°", rain: "20%", icon: Cloud },
  { day: "Monday", condition: "Mostly sunny", high: "31°", low: "21°", rain: "10%", icon: Sun },
] as const;

export function NeutralWeatherPage() {
  return (
    <main className="neutral-weather-page px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <header className="border-b border-[#b8c2ca] pb-5">
          <p className="m-0 text-sm font-bold uppercase tracking-[0.08em] text-[#586875]">Local forecast</p>
          <h1 className="mb-0 mt-2 text-4xl font-bold tracking-[-0.03em]">Weather today</h1>
          <p className="mb-0 mt-2 text-[#586875]">Pune · Saturday, 29 August · saved demo summary</p>
        </header>

        <section className="mt-6 border border-[#b8c2ca] bg-white p-5" aria-labelledby="current-weather-heading">
          <div className="flex items-center justify-between gap-5">
            <div>
              <h2 id="current-weather-heading" className="m-0 text-xl">Cloudy intervals</h2>
              <p className="mb-0 mt-2 text-sm text-[#586875]">A warm afternoon with a light breeze.</p>
            </div>
            <div className="flex items-center gap-3"><CloudSun aria-hidden="true" size={42} /><strong className="text-4xl">28°</strong></div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-[#d3d9de] pt-4 text-sm">
            <div><dt className="text-[#586875]">Feels like</dt><dd className="m-0 mt-1 font-bold">30°</dd></div>
            <div><dt className="flex items-center gap-1 text-[#586875]"><Droplets aria-hidden="true" size={15} /> Humidity</dt><dd className="m-0 mt-1 font-bold">68%</dd></div>
          </dl>
        </section>

        <section className="mt-5" aria-labelledby="forecast-heading">
          <h2 id="forecast-heading" className="text-xl">Three-day outlook</h2>
          <ul className="grid list-none gap-2 p-0">
            {forecast.map(({ day, condition, high, low, rain, icon: Icon }) => (
              <li className="grid grid-cols-[1fr_auto] items-center gap-4 border border-[#c5ced5] bg-white p-4" key={day}>
                <div><strong>{day}</strong><span className="mt-1 block text-sm text-[#586875]">{condition} · Rain {rain}</span></div>
                <div className="flex items-center gap-3"><Icon aria-hidden="true" size={25} /><span className="font-bold">{high} / {low}</span></div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 border-t border-[#b8c2ca] pt-5" aria-labelledby="device-data-heading">
          <h2 id="device-data-heading" className="text-lg">Browser storage</h2>
          <p className="text-sm leading-6 text-[#586875]">Remove locally saved report data from this browser. This does not clear browser history.</p>
          <ClearEverythingAction compact />
        </section>
      </div>
    </main>
  );
}
