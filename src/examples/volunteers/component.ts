import html from "../../server/templates";
import { BaseLiveViewComponent, LiveViewChangeset, LiveViewExternalEventListener, LiveViewMountParams, LiveViewSocket, StringPropertyValues } from "../../server/types";
import { SessionData } from "express-session";
import { Volunteer, changeset, create_volunteer } from "./data";
import { submit } from "../../server/templates/helpers/submit";
import { form_for } from "../../server/templates/helpers/form_for";
import { error_tag, telephone_input, text_input } from "../../server/templates/helpers/inputs";

export interface VolunteerContext {
  volunteers: Volunteer[]
  changeset: LiveViewChangeset<Volunteer>
}

export class VolunteerComponent extends BaseLiveViewComponent<VolunteerContext, unknown>
  implements LiveViewExternalEventListener<VolunteerContext, "save", Volunteer> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<VolunteerContext>) {
    return {
      volunteers: [],
      changeset: changeset({}, {})
    }
  };

  render(context: VolunteerContext) {
    const { changeset, volunteers } = context;
    return html`
    <h1>Volunteer Check-In</h1>
    <div id="checkin">

      ${form_for<Volunteer>("#", { phx_submit: "save" })}

        <div class="field">
          ${text_input<Volunteer>(changeset, "name", { placeholder: "Name", autocomplete: "off" })}
          ${error_tag(changeset, "name")}
        </div>

        <div class="field">
          ${telephone_input<Volunteer>(changeset, "phone", { placeholder: "Phone", autocomplete: "off" })}
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
    <div id="${volunteer.id}" class="volunteer ${volunteer.checked_out ? "out" : ""}">
      <div class="name">
        ${volunteer.name}
      </div>
      <div class="phone">
        📞 ${volunteer.phone}
      </div>
      <div class="status">
        ${volunteer.checked_out ? "☑️ Volunteer" : html`<button>Check Out</button>`}
      </div>
    </div>
    `
  }

  handleEvent(event: "save", params: StringPropertyValues<Pick<Volunteer, "name" | "phone">>, socket: LiveViewSocket<VolunteerContext>): VolunteerContext {
    const { volunteers } = socket.context;
    console.log("save", params);
    const volunteer: Partial<Volunteer> = {
      name: params.name,
      phone: params.phone,
    }
    const createChangeset = create_volunteer(volunteer);
    if (createChangeset.valid) {
      const newVolunteer = createChangeset.data as Volunteer;
      const newVolunteers = [newVolunteer, ...volunteers];
      const newChangeset = changeset({}, {});
      return {
        volunteers: newVolunteers,
        changeset: newChangeset
      }
    } else {
      return {
        volunteers,
        changeset: createChangeset
      }
    }
  }

}
