/* eslint-disable */
"use client";

import { useRef, useEffect, useState } from "react";
import { select } from "d3-selection";
import { scaleBand, scaleLinear, scaleOrdinal } from "d3-scale";
import { max } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { csv } from "d3-fetch";

type Diet = "herbivore" | "omnivore" | "carnivore";

interface AnimalDatum {
  name: string;
  speed: number;
  diet: Diet;
}

const VALID_DIETS: Diet[] = ["herbivore", "omnivore", "carnivore"];

const isDiet = (d: unknown): d is Diet =>
  typeof d === "string" && VALID_DIETS.includes(d as Diet);

export default function AnimalSpeedGraph() {
  const graphRef = useRef<HTMLDivElement>(null);
  const [animalData, setAnimalData] = useState<AnimalDatum[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const rows = await csv("/sample_animals.csv");

        if (!rows || rows.length === 0) {
          console.warn("CSV loaded but empty.");
          return;
        }

        const NAME_KEYS = ["name", "Name", "Animal", "animal"];
        const SPEED_KEYS = [
          "speed",
          "Speed",
          "Average Speed (km/h)",
          "average speed (km/h)",
        ];
        const DIET_KEYS = ["diet", "Diet", "dietary", "Dietary"];

        const findKey = (obj: any, keys: string[]) =>
          keys.find((k) => Object.prototype.hasOwnProperty.call(obj, k)) ?? null;

        const parsed: AnimalDatum[] = rows
          .map((r: any) => {
            const nameKey = findKey(r, NAME_KEYS);
            const speedKey = findKey(r, SPEED_KEYS);
            const dietKey = findKey(r, DIET_KEYS);

            if (!nameKey || !speedKey || !dietKey) return null;

            const rawName = String(r[nameKey] ?? "").trim();
            const rawSpeed = String(r[speedKey] ?? "").trim();
            const rawDiet = String(r[dietKey] ?? "").trim().toLowerCase();

            const speed = Number(rawSpeed);

            if (!rawName) return null;
            if (!Number.isFinite(speed) || speed <= 0) return null;
            if (!isDiet(rawDiet)) return null;

            return { name: rawName, speed, diet: rawDiet as Diet };
          })
          .filter((d): d is AnimalDatum => d !== null);

        if (!cancelled) {
          console.log("Loaded animals:", parsed.length);
          setAnimalData(parsed);
        }
      } catch (err) {
        console.error("Failed to load /sample_animals.csv", err);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!graphRef.current) return;

    graphRef.current.innerHTML = "";

    if (animalData.length === 0) return;

    const TOP_N = 30;
    const data = [...animalData]
      .sort((a, b) => b.speed - a.speed)
      .slice(0, TOP_N);

    const width = Math.max(graphRef.current.clientWidth, 700);
    const height = 480;
    const margin = { top: 70, right: 160, bottom: 120, left: 90 };

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = select(graphRef.current)
      .append("svg")
      .attr("width", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`);

    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", 34)
      .attr("font-size", 22)
      .attr("font-weight", 800)
      .attr("fill", "white")
      .text("Species Speed");

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = scaleBand<string>()
      .domain(data.map((d) => d.name))
      .range([0, innerW])
      .padding(0.2);

    const yMax = max(data, (d) => d.speed) ?? 0;

    const y = scaleLinear()
      .domain([0, Math.ceil(yMax / 10) * 10])
      .range([innerH, 0])
      .nice();

    const color = scaleOrdinal<Diet, string>()
      .domain(VALID_DIETS)
      .range(["#2ecc71", "#f1c40f", "#ff6b6b"]);

    g.append("g")
      .attr("opacity", 0.12)
      .call(axisLeft(y).ticks(6).tickSize(-innerW).tickFormat(() => ""))
      .select(".domain")
      .remove();

    g.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d) => x(d.name) ?? 0)
      .attr("y", (d) => y(d.speed))
      .attr("width", x.bandwidth())
      .attr("height", (d) => innerH - y(d.speed))
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("fill", (d) => color(d.diet));

    g.selectAll("text.value")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "value")
      .attr("x", (d) => (x(d.name) ?? 0) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.speed) - 6)
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("fill", "white")
      .text((d) => Math.round(d.speed));

    const xAxis = axisBottom(x).tickSizeOuter(0);
    const yAxis = axisLeft(y).ticks(6).tickSizeOuter(0);

    const gx = g
      .append("g")
      .attr("transform", `translate(0, ${innerH})`)
      .call(xAxis);

    gx.selectAll("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-28)")
      .attr("dx", "-0.6em")
      .attr("dy", "0.35em");

    g.append("g").call(yAxis);

    g.selectAll(".tick text").attr("fill", "white");
    g.selectAll(".domain").attr("stroke", "white");
    g.selectAll(".tick line").attr("stroke", "white");

    g.append("text")
      .attr("x", innerW / 2)
      .attr("y", innerH + 88)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", "white")
      .text("Animal");

    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerH / 2)
      .attr("y", -60)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", "white")
      .text("Speed (km/h)");

    const legend = svg
      .append("g")
      .attr(
        "transform",
        `translate(${margin.left + innerW + 22}, ${margin.top})`
      );

    VALID_DIETS.forEach((diet, i) => {
      const group = legend
        .append("g")
        .attr("transform", `translate(0, ${i * 22})`);

      group
        .append("rect")
        .attr("width", 14)
        .attr("height", 14)
        .attr("rx", 3)
        .attr("fill", color(diet));

      group
        .append("text")
        .attr("x", 20)
        .attr("y", 11)
        .attr("font-size", 12)
        .attr("fill", "white")
        .attr("alignment-baseline", "middle")
        .text(diet.charAt(0).toUpperCase() + diet.slice(1));
    });

    svg
      .append("text")
      .attr("x", margin.left)
      .attr("y", height - 14)
      .attr("font-size", 11)
      .attr("opacity", 0.7)
      .attr("fill", "white")
      .text(`Showing top ${TOP_N} animals.`);
  }, [animalData]);

  return (
    <div
      ref={graphRef}
      style={{
        width: "100%",
        minHeight: 480,
      }}
    />
  );
}
