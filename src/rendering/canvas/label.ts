/**
 * Sigma.js Canvas Renderer Label Component
 * =========================================
 *
 * Function used by the canvas renderer to display a single node's label.
 * @module
 */
import { Settings } from "../../settings";
import { NodeDisplayData, PartialButFor } from "../../types";

export default function drawLabel(
  context: CanvasRenderingContext2D,
  data: PartialButFor<NodeDisplayData, "x" | "y" | "size" | "label" | "color" | "icon">,
  settings: Settings,
): void {
  if (!data.label) return;

  const size = settings.labelSize,
    font = settings.labelFont,
    weight = settings.labelWeight;

  context.fillStyle = "#000";
  context.font = `${weight} ${size}px ${font}`;

  context.fillText(data.label, data.x + data.size + 3, data.y + size / 3);
  // context.fillText(data.label, data.x -  data.label.length * 4 , data.y + data.size + 14);
  let img = new Image();
  img.src = "http://localhost:3000/yhk.svg";
  // img.src = "./img/icon/" + data.icon + ".svg";
  context.drawImage(img,  data.x - data.size/2 , data.y - data.size/2 ,data.size ,data.size);
}
