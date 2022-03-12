import { SessionData } from "express-session";
import { BaseLiveView, LiveViewContext, LiveViewExternalEventListener, LiveViewMountParams, LiveViewSocket } from "../server";
import { html } from "../server/templates";
import { numberToCurrency } from "./utils";


export interface LicenseContext extends LiveViewContext {
  seats: number;
  amount: number;
}

export class LicenseLiveViewComponent extends BaseLiveView<LicenseContext, unknown> implements
  LiveViewExternalEventListener<LicenseContext, "update", Pick<LicenseContext, "seats">>
{

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<LicenseContext>) {
    const seats = 2;
    const amount = calculateLicenseAmount(seats);
    socket.assign({ seats, amount });
  };

  render(context: LicenseContext) {
    return html`
    <h1>Team License</h1>
    <div id="license">
      <div class="card">
        <div class="content">
          <div class="seats">
            🪑
            <span>
              Your license is currently for
              <strong>${context.seats}</strong> seats.
            </span>
          </div>

          <form phx-change="update">
            <input type="range" min="1" max="10"
                  name="seats" value="${context.seats}" />
          </form>

          <div class="amount">
            ${numberToCurrency(context.amount)}
          </div>
        </div>
      </div>
    </div>
    `
  };

  handleEvent(event: "update", params: { seats: string }, socket: LiveViewSocket<LicenseContext>) {
    const seats = Number(params.seats || 2);
    const amount = calculateLicenseAmount(seats);
    socket.assign({ seats, amount });
  }

}

function calculateLicenseAmount(seats: number): number {
  if (seats <= 5) {
    return seats * 20;
  } else {
    return 100 + (seats - 5) * 15;
  }
}

