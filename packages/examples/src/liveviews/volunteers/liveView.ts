import {
  BaseLiveView,
  error_tag,
  form_for,
  html,
  LiveViewChangeset,
  LiveViewMeta,
  LiveViewMountParams,
  LiveViewSocket,
  SessionData,
  submit,
  telephone_input,
  text_input,
} from "liveviewjs";
import {
  changeset,
  createVolunteer,
  getVolunteer,
  listVolunteers,
  updateVolunteer,
  Volunteer,
  VolunteerMutationEvent,
} from "./data";

interface Context {
  volunteers: Volunteer[];
  changeset: LiveViewChangeset<Volunteer>;
}

type Events =
  | { type: "save"; name: string; phone: string }
  | { type: "validate"; name: string; phone: string }
  | { type: "toggle-status"; id: string };

export class VolunteersLiveView extends BaseLiveView<Context, Events, VolunteerMutationEvent> {
  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context>) {
    if (socket.connected) {
      // listen for changes to volunteer data
      socket.subscribe("volunteer");
    }

    socket.assign({
      volunteers: listVolunteers(),
      changeset: changeset({}, {}),
    });

    // reset volunteers to empty array after each render
    // in other words don't store this in memory
    socket.tempAssign({ volunteers: [] });
  }

  render(context: Context, meta: LiveViewMeta) {
    const { changeset, volunteers } = context;
    const { csrfToken } = meta;
    return html`
    <h1>Volunteer Check-In</h1>
    <div id="checkin">

      ${form_for<Volunteer>("#", meta.csrfToken, {
        phx_submit: "save",
        phx_change: "validate",
      })}

        <div class="field">
          ${text_input<Volunteer>(changeset, "name", { placeholder: "Name", autocomplete: "off", phx_debounce: 1000 })}
            ${error_tag(changeset, "name")}
        </div>

        <div class="field">
          ${telephone_input<Volunteer>(changeset, "phone", {
            placeholder: "Phone",
            autocomplete: "off",
            phx_debounce: "blur",
          })}
            ${error_tag(changeset, "phone")}
        </div>
        ${submit("Check In", { phx_disable_with: "Saving..." })}
        </form>

        <div id="volunteers" phx-update="prepend">
          ${volunteers.map(this.renderVolunteer)}
        </div>
    </div>
    `;
  }

  renderVolunteer(volunteer: Volunteer) {
    return html`
      <div id="${volunteer.id}" class="volunteer ${volunteer.checked_out ? " out" : ""}">
        <div class="name">${volunteer.name}</div>
        <div class="phone">📞 ${volunteer.phone}</div>
        <div class="status">
          <button phx-click="toggle-status" phx-value-id="${volunteer.id}" phx-disable-with="Saving...">
            ${volunteer.checked_out ? "Check In" : "Check Out"}
          </button>
        </div>
      </div>
    `;
  }

  handleEvent(event: Events, socket: LiveViewSocket<Context>) {
    switch (event.type) {
      case "validate":
        socket.assign({
          changeset: changeset({}, event, "validate"),
        });
        break;
      case "save":
        const { name, phone } = event;
        // attempt to create the volunteer from the form data
        const createChangeset = createVolunteer({ name, phone });
        socket.assign({
          volunteers: createChangeset.valid ? [createChangeset.data as Volunteer] : [], // no volunteers to prepend
          changeset: createChangeset.valid ? changeset({}, {}) : createChangeset, // errors for form
        });
        break;
      case "toggle-status":
        // lookup volunteer by id
        const volunteer = getVolunteer(event.id);
        // toggle checked_out status (ignoring changeset for now)
        updateVolunteer(volunteer!, { checked_out: !volunteer!.checked_out });
        socket.assign({
          volunteers: listVolunteers(),
          changeset: changeset({}, {}),
        });
        break;
    }
  }

  handleInfo(event: VolunteerMutationEvent, socket: LiveViewSocket<Context>) {
    // console.log("received", event, socket.id);
    const { volunteer } = event;
    socket.assign({
      volunteers: [volunteer],
      changeset: changeset({}, {}),
    });
  }
}
