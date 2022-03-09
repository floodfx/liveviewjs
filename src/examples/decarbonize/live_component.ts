import { BaseLiveComponent, html, LiveComponentMeta, LiveViewTemplate } from "../../server";

export interface DecarboinizeCalculatorContext {
  eCars: number;
  gasCars: number;
}

export class DecarboinizeCalculator extends BaseLiveComponent<DecarboinizeCalculatorContext> {

  render(context: DecarboinizeCalculatorContext, meta: LiveComponentMeta): LiveViewTemplate {
    const { eCars, gasCars } = context;
    const { myself } = meta;
    return html`
      <div phx-target="${myself}">
        <h1>Decarbonize Calculator (myself = ${myself})</h1>
        <div>
          <label>eCars</label>
          <span>${eCars}</span>
        </div>
        <div>
          <label>gasCars</label>
          <span>${gasCars}</span>
        </div>
      </div>
    `;
  }

}