/// <reference types="node" />
import * as liveviewjs from 'liveviewjs';
import { BaseLiveView, LiveViewMountParams, SessionData, LiveViewSocket, AnyLiveContext, LiveViewMeta, BaseLiveComponent, LiveComponentMeta, LiveViewTemplate, LiveComponentSocket, HtmlSafeString, LiveViewChangeset } from 'liveviewjs';
import { z, SomeZodObject } from 'zod';

interface Store {
    name: string;
    street: string;
    phone_number: string;
    city: string;
    zip: string;
    open: boolean;
    hours: string;
}

interface Context$9 {
    zip: string;
    city: string;
    stores: Store[];
    matches: string[];
    loading: boolean;
}
declare type Events$9 = {
    type: "zip-search";
    zip: string;
} | {
    type: "city-search";
    city: string;
} | {
    type: "suggest-city";
    city: string;
};
declare type Infos$1 = {
    type: "run_zip_search";
    zip: string;
} | {
    type: "run_city_search";
    city: string;
};
declare class AutocompleteLiveView extends BaseLiveView<Context$9, Events$9, Infos$1> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context$9>): void;
    renderStoreStatus(store: Store): liveviewjs.HtmlSafeString;
    renderStore(store: Store): liveviewjs.HtmlSafeString;
    renderLoading(): liveviewjs.HtmlSafeString;
    render(context: Context$9): liveviewjs.HtmlSafeString;
    handleEvent(event: Events$9, socket: LiveViewSocket<Context$9>): void;
    handleInfo(info: Infos$1, socket: LiveViewSocket<Context$9>): void;
}

declare class DecarbonizeLiveView extends BaseLiveView {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<AnyLiveContext>): void;
    render(context: AnyLiveContext, meta: LiveViewMeta): Promise<liveviewjs.HtmlSafeString>;
}

declare type VehicleType = "gas" | "electric" | "hybrid" | "dontHave";
declare type SpaceHeatingType = "gas" | "oil" | "electric" | "radiant" | "heatpump" | "other" | "notSure";
declare type GridElectricityType = "grid" | "renewable" | "commSolar" | "notSure";

interface Context$8 {
    vehicle1: VehicleType;
    vehicle2: VehicleType;
    spaceHeating: SpaceHeatingType;
    gridElectricity: GridElectricityType;
    carbonFootprintTons: number;
}
declare type Events$8 = {
    type: "calculate";
    vehicle1: VehicleType;
    vehicle2: VehicleType;
    spaceHeating: SpaceHeatingType;
    gridElectricity: GridElectricityType;
};
declare class CalculatorLiveComponent extends BaseLiveComponent<Context$8, Events$8> {
    render(context: Context$8, meta: LiveComponentMeta): LiveViewTemplate;
    renderFootprint(carbonFootprintTons: number, myself: number, context: Context$8): liveviewjs.HtmlSafeString;
    renderChart(id: string, context: Context$8): liveviewjs.HtmlSafeString;
    handleEvent(event: Events$8, socket: LiveComponentSocket<Context$8>): void;
    getChartData(id: string, context: Context$8): {
        chartId: string;
        data: {
            labels: string[];
            datasets: {
                data: number[];
                backgroundColor: string[];
            }[];
        };
    };
}

interface Context$7 {
    seats: number;
    amount: number;
}
declare type Events$7 = {
    type: "update";
    seats: string;
};
declare class LicenseLiveView extends BaseLiveView<Context$7, Events$7> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context$7>): void;
    render(context: Context$7): liveviewjs.HtmlSafeString;
    handleEvent(event: Events$7, socket: LiveViewSocket<Context$7>): void;
}

interface Context$6 {
    brightness: number;
}
declare type Events$6 = {
    type: "on";
} | {
    type: "off";
} | {
    type: "up";
} | {
    type: "down";
} | {
    type: "key_update";
    key: string;
};
declare class LightLiveView extends BaseLiveView<Context$6, Events$6> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context$6>): void;
    render(context: Context$6): liveviewjs.HtmlSafeString;
    handleEvent(event: Events$6, socket: LiveViewSocket<Context$6>): void;
}

interface Context$5 {
    zip: string;
    stores: Store[];
    loading: boolean;
}
declare type Events$5 = {
    type: "zip-search";
    zip: string;
};
declare type Infos = {
    type: "run_zip_search";
    zip: string;
};
declare class SearchLiveView extends BaseLiveView<Context$5, Events$5, Infos> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context$5>): void;
    renderStoreStatus(store: Store): liveviewjs.HtmlSafeString;
    renderStore(store: Store): liveviewjs.HtmlSafeString;
    renderLoading(): liveviewjs.HtmlSafeString;
    render(context: Context$5): liveviewjs.HtmlSafeString;
    handleEvent(event: Events$5, socket: LiveViewSocket<Context$5>): void;
    handleInfo(info: Infos, socket: LiveViewSocket<Context$5>): void;
}

interface Donation$1 {
    id: string;
    emoji: string;
    item: string;
    quantity: number;
    days_until_expires: number;
}

interface Options {
    page: number;
    perPage: number;
}
interface Context$4 {
    options: Options;
    donations: Donation$1[];
}
declare type Events$4 = {
    type: "select-per-page";
    perPage: string;
};
declare class PaginateLiveView extends BaseLiveView<Context$4, Events$4> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context$4>): void;
    handleParams(url: URL, socket: LiveViewSocket<Context$4>): void;
    render(context: Context$4): HtmlSafeString;
    handleEvent(event: Events$4, socket: LiveViewSocket<Context$4>): void;
    pageLinks(page: number, perPage: number): HtmlSafeString;
    paginationLink(text: string, pageNum: number, perPageNum: number, className: string): HtmlSafeString;
    renderDonations(donations: Donation$1[]): HtmlSafeString[];
    expiresDecoration(donation: Donation$1): number | HtmlSafeString;
}

interface Context$3 {
    newOrders: number;
    salesAmount: number;
    satisfaction: number;
}
declare type Events$3 = {
    type: "refresh";
};
declare type Info = {
    type: "tick";
};
declare class SalesDashboardLiveView extends BaseLiveView<Context$3, Events$3, Info> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context$3>): void;
    render(context: Context$3): liveviewjs.HtmlSafeString;
    handleEvent(event: Events$3, socket: LiveViewSocket<Context$3>): void;
    handleInfo(info: Info, socket: LiveViewSocket<Context$3>): void;
}

interface Server {
    id: string;
    name: string;
    status: string;
    deploy_count: number;
    size: number;
    framework: string;
    git_repo: string;
    last_commit_id: string;
    last_commit_message: string;
}

interface Context$2 {
    servers: Server[];
    selectedServer: Server;
}
declare type Events$2 = {
    type: "select";
    id: string;
};
declare class ServersLiveView extends BaseLiveView<Context$2, Events$2> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context$2>): void;
    handleParams(url: URL, socket: LiveViewSocket<Context$2>): void;
    render(context: Context$2): LiveViewTemplate;
    private link_body;
}

interface Donation {
    id: number;
    emoji: string;
    item: string;
    quantity: number;
    days_until_expires: number;
}

interface PaginateOptions {
    page: number;
    perPage: number;
}
interface SortOptions {
    sortby: keyof Donation;
    sortOrder: "asc" | "desc";
}
interface Context$1 {
    options: PaginateOptions & SortOptions;
    donations: Donation[];
}
declare type Events$1 = {
    type: "select-per-page";
    perPage: string;
} | {
    type: "change-sort";
    sortby: string;
    sortOrder: string;
};
declare class SortLiveView extends BaseLiveView<Context$1, Events$1> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context$1>): void;
    handleParams(url: URL, socket: LiveViewSocket<Context$1>): void;
    render(context: Context$1): HtmlSafeString;
    handleEvent(event: Events$1, socket: LiveViewSocket<Context$1>): void;
    sort_emoji(sortby: keyof Donation, sortby_value: string, sortOrder: "asc" | "desc"): "" | "👇" | "☝️";
    pageLinks(page: number, perPage: number, sortby: keyof Donation, sortOrder: "asc" | "desc"): HtmlSafeString;
    paginationLink(text: string, pageNum: number, perPageNum: number, sortby: keyof Donation, sortOrder: "asc" | "desc", className: string): HtmlSafeString;
    renderDonations(donations: Donation[]): HtmlSafeString[];
    expiresDecoration(donation: Donation): number | HtmlSafeString;
}

declare const VolunteerSchema: SomeZodObject;
declare type Volunteer = z.infer<typeof VolunteerSchema>;
declare type VolunteerMutationEvent = {
    type: "created";
    volunteer: Volunteer;
} | {
    type: "updated";
    volunteer: Volunteer;
};

interface Context {
    volunteers: Volunteer[];
    changeset: LiveViewChangeset<Volunteer>;
}
declare type Events = {
    type: "save";
    name: string;
    phone: string;
} | {
    type: "validate";
    name: string;
    phone: string;
} | {
    type: "toggle-status";
    id: string;
};
declare class VolunteersLiveView extends BaseLiveView<Context, Events, VolunteerMutationEvent> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<Context>): void;
    render(context: Context, meta: LiveViewMeta): liveviewjs.HtmlSafeString;
    renderVolunteer(volunteer: Volunteer): liveviewjs.HtmlSafeString;
    handleEvent(event: Events, socket: LiveViewSocket<Context>): void;
    handleInfo(event: VolunteerMutationEvent, socket: LiveViewSocket<Context>): void;
}

export { AutocompleteLiveView, CalculatorLiveComponent, Context$6 as Context, DecarbonizeLiveView, Events$6 as Events, LicenseLiveView, LightLiveView, PaginateLiveView, PaginateOptions, SalesDashboardLiveView, SearchLiveView, ServersLiveView, SortLiveView, SortOptions, VolunteersLiveView };
