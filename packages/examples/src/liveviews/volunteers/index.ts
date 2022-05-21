import {
  createLiveView,
  error_tag,
  form_for,
  html,
  LiveViewChangeset,
  submit,
  telephone_input,
  text_input,
} from "liveviewjs";
import { changeset, createVolunteer, getVolunteer, listVolunteers, updateVolunteer, Volunteer } from "./data";

export const volunteerLiveView = createLiveView({
  mount: async (socket) => {
    if (socket.connected) {
      // listen for changes to volunteer data
      await socket.subscribe("volunteer");
    }

    socket.assign({
      volunteers: listVolunteers(),
      changeset: changeset({}, {}),
    });

    // reset volunteers to empty array after each render
    // in other words don't store this in memory
    socket.tempAssign({ volunteers: [] });
  },

  handleEvent: (
    event:
      | { type: "save"; name: string; phone: string }
      | { type: "validate"; name: string; phone: string }
      | { type: "toggle-status"; id: string },
    socket
  ) => {
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
  },

  handleInfo: (info, socket) => {
    // console.log("received", info, socket.id);
    const { volunteer } = info;
    socket.assign({
      volunteers: [volunteer],
      changeset: changeset({}, {}),
    });
  },

  render: (
    context: {
      volunteers: Volunteer[];
      changeset: LiveViewChangeset<Volunteer>;
    },
    meta
  ) => {
    const { changeset, volunteers } = context;
    const { csrfToken } = meta;
    return html`
    <h1>Volunteer Check-In</h1>
    <div id="checkin">

      ${form_for<Volunteer>("#", csrfToken, {
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
          ${volunteers.map(renderVolunteer)}
        </div>
    </div>
    `;
  },
});

function renderVolunteer(volunteer: Volunteer) {
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
