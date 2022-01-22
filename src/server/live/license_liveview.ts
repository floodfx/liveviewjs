import escapeHtml from "../liveview/templates";
import { LiveViewComponent, LiveViewContext, LiveViewExternalEventListener } from "../liveview/types";
import { LightContext } from "./light_liveview";

export interface LicenseContext {
  seats: number;
  amount: number;
}

const _db: { [key: string]: LicenseContext } = {};

export class LicenseLiveViewComponent implements
  LiveViewComponent<LicenseContext>,
  LiveViewExternalEventListener<LicenseContext, "update", Pick<LicenseContext, "seats">>
  {


  mount(params: any, session: any, socket: any) {
    // store this somewhere durable
    const seats = 2;
    const amount = calculateLicenseAmount(seats);
    const ctx: LicenseContext = { seats, amount};
    _db[socket.id] = ctx;
    return { data: ctx };
  };

  render(context: LiveViewContext<LicenseContext>) {
    return escapeHtml`
    <h1>Team License</h1>
    <div id="license">
      <div class="card">
        <div class="content">
          <div class="seats">
            <img src="images/license.svg">
            <span>
              Your license is currently for
              <strong>${ context.data.seats }</strong> seats.
            </span>
          </div>

          <form phx-change="update">
            <input type="range" min="1" max="10"
                  name="seats" value="${ context.data.seats }" />
          </form>

          <div class="amount">
            ${ numberToCurrency(context.data.amount) }
          </div>
        </div>
      </div>
    </div>
    `
  };

  handleEvent(event: "update", params: {seats: number}, socket: any) {
    console.log("event:", event, params, socket);
    const { seats } = params;
    const amount = calculateLicenseAmount(seats);
    return { data: { seats, amount} };
  }

}

function calculateLicenseAmount(seats: number): number {
  if(seats <= 5) {
    return seats * 20;
  } else {
    return 100 + (seats - 5) * 15;
  }
}

function numberToCurrency(amount: number) {
  var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  });
  return formatter.format(amount);
}