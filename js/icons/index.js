import { svg } from "redom";

export const calendarIcon = (size = 16, options) => {
  const { stroke = "currentColor", fill = "currentColor", onclick } = options || {};
  let el = svg(
    "svg",
    svg(
      "symbol",
      { id: "calendar", viewBox: `0 0 32 32` },
      svg("path", {
        x: 0,
        y: 0,
        width: 32,
        height: 32,
        stroke: stroke,
        fill: fill,
        d:
          "M10 12h4v4h-4zM16 12h4v4h-4zM22 12h4v4h-4zM4 24h4v4h-4zM10 24h4v4h-4zM16 24h4v4h-4zM10 18h4v4h-4zM16 18h4v4h-4zM22 18h4v4h-4zM4 18h4v4h-4zM26 0v2h-4v-2h-14v2h-4v-2h-4v32h30v-32h-4zM28 30h-26v-22h26v22z"
      })
    ),
    svg("use", { xlink: { href: "#calendar" } })
  );

  if (onclick) {
    el.addEventListener("click", onclick);
  }
  return el;
};

export const dashboardIcon = (size = 16, options) => {
  const { stroke = "currentColor", fill = "currentColor", onclick } =  options || {};
  let el = svg(
    "svg",
    svg(
      "symbol",
      { id: "dashboard", viewBox: `0 0 32 32` },
      svg("path", {
        x: 0,
        y: 0,
        width: 32,
        height: 32,
        stroke: stroke,
        fill: fill,
        d:
          "M4 28h28v4h-32v-32h4zM9 26c-1.657 0-3-1.343-3-3s1.343-3 3-3c0.088 0 0.176 0.005 0.262 0.012l3.225-5.375c-0.307-0.471-0.487-1.033-0.487-1.638 0-1.657 1.343-3 3-3s3 1.343 3 3c0 0.604-0.179 1.167-0.487 1.638l3.225 5.375c0.086-0.007 0.174-0.012 0.262-0.012 0.067 0 0.133 0.003 0.198 0.007l5.324-9.316c-0.329-0.482-0.522-1.064-0.522-1.691 0-1.657 1.343-3 3-3s3 1.343 3 3c0 1.657-1.343 3-3 3-0.067 0-0.133-0.003-0.198-0.007l-5.324 9.316c0.329 0.481 0.522 1.064 0.522 1.691 0 1.657-1.343 3-3 3s-3-1.343-3-3c0-0.604 0.179-1.167 0.487-1.638l-3.225-5.375c-0.086 0.007-0.174 0.012-0.262 0.012s-0.176-0.005-0.262-0.012l-3.225 5.375c0.307 0.471 0.487 1.033 0.487 1.637 0 1.657-1.343 3-3 3z"
      })
    ),
    svg("use", { xlink: { href: "#dashboard" } })
  );

  if (onclick) {
    el.addEventListener("click", onclick);
  }

  //el.style = { display: 'inline-block', strokeWidth: 0, stroke: stroke, fill: fill };
  return el;
};
