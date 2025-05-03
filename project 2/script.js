import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const svg = d3.select("#chart")
  .attr("width", 700)
  .attr("height", 450);


let hops = await d3.csv("bitter1.csv", d3.autoType)

// Get the SVG dimensions
const width = svg.node().clientWidth || 700;  // fallback to 700 if not rendered yet
const height = svg.node().clientHeight || 450; // fallback to 450 if not rendered yet

// Add some margins for padding
const margin = {top: 40, right: 40, bottom: 40, left: 40};

// Update scales to use the actual SVG dimensions
const xScale = d3.scaleLinear()
    .domain([1, 10])
    .range([margin.left, width - margin.right]);

const yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([height - margin.bottom, margin.top]);

const rScale = d3.scaleSqrt()
    .domain([0, 30])
    .range([0, Math.min(width, height) * 0.05]); // make radius relative to SVG size

// We'll map [0,30] -> [0,1] for our Sequential scales
const colorScale = d3.scaleLinear().domain([0, 30]).range([0, 1]);

// Define color schemes
const aromaColor      = d3.scaleSequential(d3.interpolateRgbBasis(["yellow","orange"]));
const bitterColor     = d3.scaleSequential(d3.interpolateRgbBasis(["lightblue","blue"]));
const allpurposeColor = d3.scaleSequential(d3.interpolateRgbBasis(["red","crimson"]));

// Create axes
const xAxis = d3.axisBottom(xScale);
const yAxis = d3.axisLeft(yScale);

  
const tooltip = d3.select("body")
  .append("div")
  .style("position", "absolute")
  .style("padding", "8px")
  .style("background", "white")
  .style("border", "1px solid #ccc")
  .style("border-radius", "4px")
  .style("pointer-events", "none")  
  .style("opacity", 0);   

// Keep track of active filters
const activeFilters = new Set([1, 2, 3]); // Start with all purposes visible

// Add click handlers to filter buttons
d3.selectAll('.legend-btn').on('click', function() {
  const purpose = parseInt(this.dataset.purpose);
  
  if (activeFilters.has(purpose)) {
    activeFilters.delete(purpose);
    this.classList.add('inactive');
  } else {
    activeFilters.add(purpose);
    this.classList.remove('inactive');
  }
  
  // Update circle visibility
  svg.selectAll("circle")
    .style("display", d => activeFilters.has(d.Purpose) ? null : "none");
});

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
    .style("display", d => activeFilters.has(d.Purpose) ? null : "none")
    // On mouseover, show tooltip & highlight
    .on("mouseover", (event, d) => {
      // Show tooltip
      tooltip
        .style("opacity", 1)
        .html(`
          <strong>${d.Name || "Hop"}</strong><br/>
          Alpha: ${d.Alpha}<br/>
          Beta: ${d.Beta}<br/>
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

// Add window resize handler
window.addEventListener('resize', () => {
    const width = svg.node().clientWidth;
    const height = svg.node().clientHeight;
    
    // Update scales
    xScale.range([margin.left, width - margin.right]);
    yScale.range([height - margin.bottom, margin.top]);
    rScale.range([0, Math.min(width, height) * 0.05]);
    
    // Update circles
    svg.selectAll("circle")
        .attr("cx", d => xScale(d.Beta))
        .attr("cy", d => yScale(d.Alpha))
        .attr("r", d => rScale(d.Guide))
        .style("display", d => activeFilters.has(d.Purpose) ? null : "none");
});

// Add this after your axes are created but before the circles
// Create 1:1 reference line
const maxValue = Math.max(
    d3.max(hops, d => d.Alpha),
    d3.max(hops, d => d.Beta)
);

// Add the line to the same group that contains your circles
svg.append("line")
    .attr("x1", xScale(0))
    .attr("y1", yScale(0))
    .attr("x2", xScale(maxValue))
    .attr("y2", yScale(maxValue))
    .attr("stroke", "gray")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "5,5")  // Creates a dashed line
    .attr("opacity", 0.5)
    .attr("class", "reference-line")
    .on("mouseover", (event) => {
      tooltip
        .style("opacity", 1)
        .html(`
          <strong>1:1 Reference Line</strong>
        `);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 20 + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

// Add a label for the line
svg.append("text")
    .attr("x", xScale(maxValue - 1))  // Offset slightly from the end
    .attr("y", yScale(maxValue - 1))
    .attr("dy", -10)  // Shift label up slightly
    .attr("text-anchor", "end")
    .attr("fill", "gray")
    .attr("font-size", "12px")
    .text("1:1 ratio");

// Calculate average ratio
const avgRatio = d3.mean(hops, d => d.Alpha / d.Beta);

// Add average ratio reference line
// Use the same maxValue we defined for the 1:1 line
svg.append("line")
    .attr("x1", xScale(0))
    .attr("y1", yScale(0))
    .attr("x2", xScale(maxValue))
    .attr("y2", yScale(maxValue * avgRatio))  // Use the average ratio
    .attr("stroke", "#2ca02c")  // Green color, you can change this
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3,3")  // Different dash pattern from 1:1 line
    .attr("opacity", 0.7)
    .attr("class", "average-ratio-line")
    .on("mouseover", (event) => {
      tooltip
        .style("opacity", 1)
        .html(`
          <strong>Average Ratio Line</strong>
        `);
    });

// Add a label for the average ratio line
svg.append("text")
    .attr("x", xScale(maxValue - 1))
    .attr("y", yScale((maxValue - 1) * avgRatio))
    .attr("dy", -10)
    .attr("text-anchor", "end")
    .attr("fill", "#2ca02c")
    .attr("font-size", "12px")
    .text(`Average ratio: ${avgRatio.toFixed(2)}:1`);
