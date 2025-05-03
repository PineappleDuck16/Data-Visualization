import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const chart = document.querySelector("#chart");

let hops = await d3.csv("bitter1.csv", d3.autoType)

let armoaColor = d3.scaleSequential(d3.interpolateRgbBasis(["yellow","orange"]));
let bitterColor = d3.scaleSequential(d3.interpolateRgbBasis(["lightblue","blue"]));
let allpurposeColor = d3.scaleSequential(d3.interpolateRgbBasis(["red","crimson"]));

let colorScale = d3.scaleLinear().domain([0,30]).range([0,1]);

let radiusScale = d3.scaleSqrt().domain([0,30]).range([0,30]);

let yscale = d3.scaleLinear().domain([0,24]).range([400,0]);
let xscale = d3.scaleLinear().domain([1,10]).range([0,600]);


  

for (let hop of hops) {
    chart.innerHTML += `<circle 
    cx="${xscale(hop.Beta)}" 
    cy="${yscale(hop.Alpha)}" 
    r="${radiusScale(hop.Guide)}" 
    fill="${hop.Purpose === 1 ? armoaColor(colorScale(hop.Guide)) : 
          hop.Purpose === 2 ? bitterColor(colorScale(hop.Guide)) : 
          hop.Purpose === 3 ? allpurposeColor(colorScale(hop.Guide)) : 
          'gray'}"
    ></circle>`;
}

const tooltip = d3.select("body")
  .append("div")
  .style("position", "absolute")
  .style("padding", "8px")
  .style("background", "white")
  .style("border", "1px solid #ccc")
  .style("border-radius", "4px")
  .style("pointer-events", "none")  // so it doesn’t interfere with mouse
  .style("opacity", 0);    

  svg.selectAll("circle")
  .data(hops)
  .join("circle")
    .attr("cx", d => xScale(d.Beta))
    .attr("cy", d => yScale(d.Alpha))
    .attr("r",  d => rScale(d.Guide))
    .attr("fill", d => {
      if (d.Purpose === 1) {
        return aromaColor(colorScale(d.Guide));
      } else if (d.Purpose === 2) {
        return bitterColor(colorScale(d.Guide));
      } else if (d.Purpose === 3) {
        return allpurposeColor(colorScale(d.Guide));
      } else {
        return "gray";
      }
    })
    // On mouseover, show tooltip & highlight
    .on("mouseover", (event, d) => {
      // Show tooltip
      tooltip
        .style("opacity", 1)
        .html(`
          <strong>${d.Name || "Hop"}</strong><br/>
          Alpha: ${d.Alpha}<br/>
          Beta: ${d.Beta}<br/>
          Guide: ${d.Guide}
        `);

      // Add a visible stroke to the circle
      d3.select(event.currentTarget)
        .attr("stroke", "black")
        .attr("stroke-width", 2);
    })
    // On mousemove, reposition the tooltip
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top",  event.pageY - 20 + "px");
    })
    // On mouseout, hide tooltip & remove highlight
    .on("mouseout", (event) => {
      tooltip.style("opacity", 0);

      d3.select(event.currentTarget)
        .attr("stroke", "none");
    });