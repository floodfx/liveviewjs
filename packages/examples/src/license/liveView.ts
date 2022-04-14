import { BaseLiveView, LiveViewMountParams, LiveViewSocket, SessionData, html } from "liveviewjs";
import { numberToCurrency } from "../utils";

interface Context {
  seats: number;
  amount: number;
}

type Events = { type: "update"; seats: string };

export class LicenseLiveView extends BaseLiveView<Context, Events> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context>) {
    const seats = 2;
    const amount = calculateLicenseAmount(seats);
    socket.assign({ seats, amount });
  }

  render(context: Context) {
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
              <input type="range" min="1" max="10" name="seats" value="${context.seats}" />
            </form>

            <div class="amount">${numberToCurrency(context.amount)}</div>
          </div>
        </div>
      </div>
    `;
  }

  handleEvent(event: Events, socket: LiveViewSocket<Context>) {
    const seats = Number(event.seats || 2);
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
