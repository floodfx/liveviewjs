import html from "../../server/templates";
import { BaseLiveViewComponent, LiveViewChangeset, LiveViewExternalEventListener, LiveViewMountParams, LiveViewSocket, StringPropertyValues } from "../../server/types";
import { SessionData } from "express-session";
import { Volunteer, changeset, create_volunteer, listVolunteers } from "./data";
import { submit } from "../../server/templates/helpers/submit";
import { form_for } from "../../server/templates/helpers/form_for";
import { error_tag, telephone_input, text_input } from "../../server/templates/helpers/inputs";

export interface VolunteerContext {
  volunteers: Volunteer[]
  changeset: LiveViewChangeset<Volunteer>
}

type VolunteerEvents = "save" | "validate";

export class VolunteerComponent extends BaseLiveViewComponent<VolunteerContext, unknown>
  implements LiveViewExternalEventListener<VolunteerContext, VolunteerEvents, Volunteer> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<VolunteerContext>) {
    return {
      volunteers: listVolunteers(),
      changeset: changeset({}, {})
    }
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
          ${error_tag(changeset, "name",)}
        </div>

        <div class="field">
          ${telephone_input<Volunteer>(changeset, "phone", { placeholder: "Phone", autocomplete: "off", phx_debounce: "blur" })}
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

  handleEvent(event: VolunteerEvents, params: StringPropertyValues<Pick<Volunteer, "name" | "phone">>, socket: LiveViewSocket<VolunteerContext>): VolunteerContext {
    if (event === "validate") {
      const validateChangeset = changeset({}, params);
      validateChangeset.action = "validate";
      console.log("validate", params, validateChangeset);
      return {
        volunteers: [],
        changeset: validateChangeset
      }
    } else {
      const volunteer: Partial<Volunteer> = {
        name: params.name,
        phone: params.phone,
      }
      // attempt to create the volunteer from the form data
      const createChangeset = create_volunteer(volunteer);

      // valid form data
      if (createChangeset.valid) {
        const newVolunteer = createChangeset.data as Volunteer;
        // only add new volunteer since we're using phx-update="prepend"
        // which means the new volunteer will be added to the top of the list
        const newVolunteers = [newVolunteer];
        const emptyChangeset = changeset({}, {}); // reset form
        return {
          volunteers: newVolunteers,
          changeset: emptyChangeset
        }
      }
      // form data was invalid
      else {
        return {
          volunteers: [], // no volunteers to prepend
          changeset: createChangeset // errors for form
        }
      }
    }
  }

}
