import escapeHtml from "../liveview/templates";
import { LiveViewComponent, LiveViewContext, LiveViewExternalEventListener } from "../liveview/types";

export interface LicenseContext {
  seats: number;
  amount: number;
}

const _db: { [key: string]: LicenseContext } = {};

export class LicenseLiveViewComponent implements
  LiveViewComponent<LicenseContext>
  // LiveViewExternalEventListener<LicenseContext, "on">,
  // LiveViewExternalEventListener<LicenseContext, "off">
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

  // handleEvent(event: PocEvent, params: any, socket: any) {
  //   const ctx = _db[socket.id];
  //   console.log("event:", event, socket, ctx);
  //   switch (event) {
  //     case 'off':
  //       ctx.brightness = 0;
  //       break;
  //     case 'on':
  //       ctx.brightness = 100;
  //       break;
  //     case 'up':
  //       ctx.brightness = Math.min(ctx.brightness + 10, 100);
  //       break;
  //     case 'down':
  //       ctx.brightness = Math.max(ctx.brightness - 10, 0);
  //       break;
  //   }
  //   _db[socket.id] = ctx;
  //   return { data: ctx };
  // }

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