import { SessionData } from "express-session";
import { BaseLiveView, error_tag, form_for, html, LiveViewChangeset, LiveViewContext, LiveViewExternalEventListener, LiveViewInternalEventListener, LiveViewMountParams, LiveViewSocket, StringPropertyValues, submit, telephone_input, text_input } from "../../server";
import { changeset, createVolunteer, getVolunteer, listVolunteers, updateVolunteer, Volunteer, VolunteerMutationEvent } from "./data";

export interface VolunteerContext extends LiveViewContext {
  volunteers: Volunteer[]
  changeset: LiveViewChangeset<Volunteer>
}

type VolunteerEvents = "save" | "validate" | "toggle-status";

export class VolunteerComponent extends BaseLiveView<VolunteerContext, unknown> implements
  LiveViewExternalEventListener<VolunteerContext, VolunteerEvents, Volunteer>,
  LiveViewInternalEventListener<VolunteerContext, VolunteerMutationEvent> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<VolunteerContext>) {
    if (socket.connected) {
      // listen for changes to volunteer data
      socket.subscribe('volunteer');
    }
    socket.assign({
      volunteers: listVolunteers(),
      changeset: changeset({}, {})
    });
  };

  render(context: VolunteerContext) {
    const { changeset, volunteers } = context;
    return html`
    <h1>Volunteer Check-In</h1>
    <div id="checkin">

      ${form_for<Volunteer>("#", {
        phx_submit: "save",
        phx_change: "validate"
        })}

        <div class="field">
          ${text_input<Volunteer>(changeset, "name", { placeholder: "Name", autocomplete: "off", phx_debounce: 1000 })}
            ${error_tag(changeset, "name")}
        </div>

        <div class="field">
          ${telephone_input<Volunteer>(changeset, "phone", {
            placeholder: "Phone", autocomplete: "off", phx_debounce: "blur"
            })}
            ${error_tag(changeset, "phone")}
        </div>
        ${submit("Check In", { phx_disable_with: "Saving..." })}
        </form>

        <div id="volunteers" phx-update="prepend">
          ${volunteers.map(this.renderVolunteer)}
        </div>
    </div>
    `
  };

  renderVolunteer(volunteer: Volunteer) {
    return html`
    <div id="${volunteer.id}" class="volunteer ${volunteer.checked_out ? " out" : "" }">
      <div class="name">
        ${volunteer.name}
      </div>
      <div class="phone">
        📞 ${volunteer.phone}
      </div>
      <div class="status">
        <button phx-click="toggle-status" phx-value-id="${volunteer.id}" phx-disable-with="Saving...">
          ${volunteer.checked_out ? "Check In" : "Check Out"}
        </button>
      </div>
    </div>
    `
  }

  handleEvent(event: VolunteerEvents, params: StringPropertyValues<Pick<Volunteer, "name" | "phone" | "id">>, socket: LiveViewSocket<VolunteerContext>) {
    if (event === "toggle-status") {
      // lookup volunteer by id
      const volunteer = getVolunteer(params.id);
      // toggle checked_out status (ignoring changeset for now)
      updateVolunteer(volunteer!, { checked_out: !volunteer!.checked_out });
      socket.assign({
        volunteers: listVolunteers(),
        changeset: changeset({}, {})
      })
    } else if (event === "validate") {
      const validateChangeset = changeset({}, params);
      // set an action or else the changeset will be ignored
      // and form errors will not be shown
      validateChangeset.action = "validate";
      socket.assign({
        volunteers: [],
        changeset: validateChangeset
      })
    } else {
      const volunteer: Partial<Volunteer> = {
        name: params.name,
        phone: params.phone,
      }
      // attempt to create the volunteer from the form data
      const createChangeset = createVolunteer(volunteer);
      socket.assign({
        volunteers: createChangeset.valid ? [createChangeset.data as Volunteer] : [], // no volunteers to prepend
        changeset: createChangeset.valid ? changeset({}, {}) : createChangeset // errors for form
      })
    }
  }

  handleInfo(event: VolunteerMutationEvent, socket: LiveViewSocket<VolunteerContext>) {
    // console.log("received", event, socket.id);
    const { volunteer } = event;
    socket.assign({
      volunteers: [volunteer],
      changeset: changeset({}, {})
    })
  }

}
