import * as liveviewjs from 'liveviewjs';
import { LiveViewContext, BaseLiveView, LiveViewExternalEventListener, LiveViewInternalEventListener, LiveViewMountParams, SessionData, LiveViewSocket, LiveViewMeta, LiveComponentContext, BaseLiveComponent, LiveComponentMeta, LiveViewTemplate, LiveComponentSocket, LiveView, StringPropertyValues, HtmlSafeString, LiveViewChangeset } from 'liveviewjs';
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

interface AutocompleteContext extends LiveViewContext {
    zip: string;
    city: string;
    stores: Store[];
    matches: string[];
    loading: boolean;
}
declare class AutocompleteLiveViewComponent extends BaseLiveView<AutocompleteContext, unknown> implements LiveViewExternalEventListener<AutocompleteContext, "zip-search", Pick<AutocompleteContext, "zip">>, LiveViewExternalEventListener<AutocompleteContext, "suggest-city", Pick<AutocompleteContext, "city">>, LiveViewInternalEventListener<AutocompleteContext, {
    type: "run_zip_search";
    zip: string;
}>, LiveViewInternalEventListener<AutocompleteContext, {
    type: "run_city_search";
    city: string;
}> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<AutocompleteContext>): void;
    renderStoreStatus(store: Store): liveviewjs.HtmlSafeString;
    renderStore(store: Store): liveviewjs.HtmlSafeString;
    renderLoading(): liveviewjs.HtmlSafeString;
    render(context: AutocompleteContext): liveviewjs.HtmlSafeString;
    handleEvent(event: "zip-search" | "suggest-city", params: {
        zip: string;
    } | {
        city: string;
    }, socket: LiveViewSocket<AutocompleteContext>): void;
    handleInfo(event: {
        type: "run_zip_search";
        zip: string;
    } | {
        type: "run_city_search";
        city: string;
    }, socket: LiveViewSocket<AutocompleteContext>): void;
}

declare class DecarbonizeLiveView extends BaseLiveView<LiveViewContext, unknown> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<LiveViewContext>): void;
    render(context: LiveViewContext, meta: LiveViewMeta): Promise<liveviewjs.HtmlSafeString>;
}

declare type VehicleType = "gas" | "electric" | "hybrid" | "dontHave";
declare type SpaceHeatingType = "gas" | "oil" | "electric" | "radiant" | "heatpump" | "other" | "notSure";
declare type GridElectricityType = "grid" | "renewable" | "commSolar" | "notSure";
interface DecarboinizeCalculatorContext extends LiveComponentContext {
    vehicle1: VehicleType;
    vehicle2: VehicleType;
    spaceHeating: SpaceHeatingType;
    gridElectricity: GridElectricityType;
    carbonFootprintTons: number;
}
declare class DecarboinizeCalculator extends BaseLiveComponent<DecarboinizeCalculatorContext> {
    render(context: DecarboinizeCalculatorContext, meta: LiveComponentMeta): LiveViewTemplate;
    renderFootprint(carbonFootprintTons: number, myself: number, context: DecarboinizeCalculatorContext): liveviewjs.HtmlSafeString;
    renderChart(id: string, context: DecarboinizeCalculatorContext): liveviewjs.HtmlSafeString;
    handleEvent(event: string, params: Record<string, string>, socket: LiveComponentSocket<DecarboinizeCalculatorContext>): void;
    getChartData(id: string, context: DecarboinizeCalculatorContext): {
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

interface LicenseContext extends LiveViewContext {
    seats: number;
    amount: number;
}
declare class LicenseLiveViewComponent extends BaseLiveView<LicenseContext, unknown> implements LiveViewExternalEventListener<LicenseContext, "update", Pick<LicenseContext, "seats">> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<LicenseContext>): void;
    render(context: LicenseContext): liveviewjs.HtmlSafeString;
    handleEvent(event: "update", params: {
        seats: string;
    }, socket: LiveViewSocket<LicenseContext>): void;
}

interface LightContext extends LiveViewContext {
    brightness: number;
}
declare type LightEvent = "on" | "off" | "up" | "down" | "key_update";
declare class LightLiveViewComponent extends BaseLiveView<LightContext, never> implements LiveView<LightContext, never>, LiveViewExternalEventListener<LightContext, LightEvent, {
    key: string;
}> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<LightContext>): void;
    render(context: LightContext): liveviewjs.HtmlSafeString;
    handleEvent(event: LightEvent, params: {
        key: string;
    }, socket: LiveViewSocket<LightContext>): void;
}

interface SearchContext extends LiveViewContext {
    zip: string;
    stores: Store[];
    loading: boolean;
}
declare class SearchLiveViewComponent extends BaseLiveView<SearchContext, unknown> implements LiveViewExternalEventListener<SearchContext, "zip-search", Pick<SearchContext, "zip">>, LiveViewInternalEventListener<SearchContext, {
    type: "run_zip_search";
    zip: string;
}> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<SearchContext>): void;
    renderStoreStatus(store: Store): liveviewjs.HtmlSafeString;
    renderStore(store: Store): liveviewjs.HtmlSafeString;
    renderLoading(): liveviewjs.HtmlSafeString;
    render(context: SearchContext): liveviewjs.HtmlSafeString;
    handleEvent(event: "zip-search", params: {
        zip: string;
    }, socket: LiveViewSocket<SearchContext>): void;
    handleInfo(event: {
        type: "run_zip_search";
        zip: string;
    }, socket: LiveViewSocket<SearchContext>): void;
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
interface PaginateContext extends LiveViewContext {
    options: Options;
    donations: Donation$1[];
}
declare class PaginateLiveViewComponent extends BaseLiveView<PaginateContext, Options> implements LiveViewExternalEventListener<PaginateContext, "select-per-page", Pick<Options, "perPage">> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<PaginateContext>): void;
    handleParams(params: StringPropertyValues<Options>, url: string, socket: LiveViewSocket<PaginateContext>): void;
    render(context: PaginateContext): HtmlSafeString;
    handleEvent(event: "select-per-page", params: StringPropertyValues<Pick<Options, "perPage">>, socket: LiveViewSocket<PaginateContext>): void;
    pageLinks(page: number, perPage: number): HtmlSafeString;
    paginationLink(text: string, pageNum: number, perPageNum: number, className: string): HtmlSafeString;
    renderDonations(donations: Donation$1[]): HtmlSafeString[];
    expiresDecoration(donation: Donation$1): number | HtmlSafeString;
}

interface SalesDashboardContext extends LiveViewContext {
    newOrders: number;
    salesAmount: number;
    satisfaction: number;
}
declare class SalesDashboardLiveViewComponent extends BaseLiveView<SalesDashboardContext, unknown> implements LiveViewExternalEventListener<SalesDashboardContext, "refresh", any>, LiveViewInternalEventListener<SalesDashboardContext, "tick"> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<SalesDashboardContext>): void;
    render(context: SalesDashboardContext): liveviewjs.HtmlSafeString;
    handleEvent(event: "refresh", params: any, socket: any): void;
    handleInfo(event: "tick", socket: LiveViewSocket<SalesDashboardContext>): void;
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

interface ServersContext extends LiveViewContext {
    servers: Server[];
    selectedServer: Server;
}
declare class ServersLiveViewComponent extends BaseLiveView<ServersContext, {
    id: string;
}> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<ServersContext>): void;
    handleParams(params: {
        id: string;
    }, url: string, socket: LiveViewSocket<ServersContext>): void;
    render(context: ServersContext): LiveViewTemplate;
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
    sort_by: keyof Donation;
    sortOrder: "asc" | "desc";
}
interface SortContext extends LiveViewContext {
    options: PaginateOptions & SortOptions;
    donations: Donation[];
}
declare class SortLiveViewComponent extends BaseLiveView<SortContext, PaginateOptions & SortOptions> implements LiveViewExternalEventListener<SortContext, "select-per-page", Pick<PaginateOptions & SortOptions, "perPage">>, LiveViewExternalEventListener<SortContext, "change-sort", Pick<PaginateOptions & SortOptions, "sort_by" | "sortOrder">> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<SortContext>): void;
    handleParams(params: StringPropertyValues<PaginateOptions & SortOptions>, url: string, socket: LiveViewSocket<SortContext>): void;
    render(context: SortContext): HtmlSafeString;
    handleEvent(event: "select-per-page" | "change-sort", params: StringPropertyValues<Pick<PaginateOptions & SortOptions, "perPage" | "sort_by" | "sortOrder">>, socket: LiveViewSocket<SortContext>): void;
    sort_emoji(sort_by: keyof Donation, sort_by_value: string, sortOrder: "asc" | "desc"): "" | "👇" | "☝️";
    pageLinks(page: number, perPage: number, sort_by: keyof Donation, sortOrder: "asc" | "desc"): HtmlSafeString;
    paginationLink(text: string, pageNum: number, perPageNum: number, sort_by: keyof Donation, sortOrder: "asc" | "desc", className: string): HtmlSafeString;
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

interface VolunteerContext extends LiveViewContext {
    volunteers: Volunteer[];
    changeset: LiveViewChangeset<Volunteer>;
}
declare type VolunteerEvents = "save" | "validate" | "toggle-status";
declare class VolunteerComponent extends BaseLiveView<VolunteerContext, unknown> implements LiveViewExternalEventListener<VolunteerContext, VolunteerEvents, Volunteer>, LiveViewInternalEventListener<VolunteerContext, VolunteerMutationEvent> {
    mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<VolunteerContext>): void;
    render(context: VolunteerContext): liveviewjs.HtmlSafeString;
    renderVolunteer(volunteer: Volunteer): liveviewjs.HtmlSafeString;
    handleEvent(event: VolunteerEvents, params: StringPropertyValues<Pick<Volunteer, "name" | "phone" | "id">>, socket: LiveViewSocket<VolunteerContext>): void;
    handleInfo(event: VolunteerMutationEvent, socket: LiveViewSocket<VolunteerContext>): void;
}

export { AutocompleteContext, AutocompleteLiveViewComponent, DecarboinizeCalculator, DecarboinizeCalculatorContext, DecarbonizeLiveView, LicenseContext, LicenseLiveViewComponent, LightContext, LightEvent, LightLiveViewComponent, PaginateContext, PaginateLiveViewComponent, PaginateOptions, SalesDashboardContext, SalesDashboardLiveViewComponent, SearchContext, SearchLiveViewComponent, ServersContext, ServersLiveViewComponent, SortContext, SortLiveViewComponent, SortOptions, VolunteerComponent, VolunteerContext };
