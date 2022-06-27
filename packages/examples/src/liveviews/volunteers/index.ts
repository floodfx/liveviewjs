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
import {
  changeset,
  createVolunteer,
  getVolunteer,
  listVolunteers,
  updateVolunteer,
  Volunteer,
  VolunteerMutationInfo,
} from "./data";

export const volunteerLiveView = createLiveView<
  // Define the Context of the LiveView
  {
    volunteers: Volunteer[];
    changeset: LiveViewChangeset<Volunteer>;
  },
  // Define events that are initiated by the end-user
  | { type: "save"; name: string; phone: string }
  | { type: "validate"; name: string; phone: string }
  | { type: "toggle-status"; id: string },
  // Define info that are initiated by the LiveView
  // In this case, these are internal info emitted from
  // pub/sub subscriptions to the Volunter's mutation activities
  VolunteerMutationInfo
>({
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

  handleEvent: (event, socket) => {
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

  // Handle Volunteer mutation
  handleInfo: (info, socket) => {
    const { volunteer } = info;
    socket.assign({
      volunteers: [volunteer],
      changeset: changeset({}, {}),
    });
  },

  render: (context, meta) => {
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
