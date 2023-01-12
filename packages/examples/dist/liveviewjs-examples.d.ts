import * as liveviewjs from 'liveviewjs';
import { LiveViewChangeset, AnyLiveEvent } from 'liveviewjs';
import { z } from 'zod';

interface Store {
    name: string;
    street: string;
    phone_number: string;
    city: string;
    zip: string;
    open: boolean;
    hours: string;
}

interface Context {
    city: string;
    stores: Store[];
    matches: string[];
    loading: boolean;
}
declare type Events = {
    type: "city-search";
    city: string;
} | {
    type: "suggest-city";
    city: string;
};
declare type Infos = {
    type: "run_city_search";
    city: string;
};
/**
 * Example of a search box with autocomplete.  Start typing a city in the search box
 * and a list of matching cities wiill appear.
 */
declare const autocompleteLiveView: liveviewjs.LiveView<Context, Events, Infos>;

declare const BookSchema: z.ZodObject<{
    id: z.ZodDefault<z.ZodString>;
    name: z.ZodString;
    author: z.ZodString;
    checked_out: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    author: string;
    checked_out: boolean;
}, {
    id?: string | undefined;
    checked_out?: boolean | undefined;
    name: string;
    author: string;
}>;
declare type Book = z.infer<typeof BookSchema>;
declare const booksLiveView: liveviewjs.LiveView<{
    books: Book[];
    changeset: LiveViewChangeset<Book>;
}, {
    type: "save";
    name: string;
    author: string;
} | {
    type: "validate";
    name: string;
    author: string;
} | {
    type: "toggle-checkout";
    id: string;
}, liveviewjs.AnyLiveInfo>;

/**
 * A basic counter that increments and decrements a number.
 */
declare const counterLiveView: liveviewjs.LiveView<{
    count: number;
}, {
    type: "increment";
} | {
    type: "decrement";
}, liveviewjs.AnyLiveInfo>;

/**
 * A basic counter that increments and decrements a number.
 */
declare const rtCounterLiveView: liveviewjs.LiveView<{
    count: number;
}, {
    type: "increment";
} | {
    type: "decrement";
}, {
    type: "counter";
    count: number;
}>;

/**
 * Dashboard that automatically refreshes every second or when a user hits refresh.
 */
declare const dashboardLiveView: liveviewjs.LiveView<{
    newOrders: number;
    salesAmount: number;
    rating: number;
    refreshes: number;
}, {
    type: "refresh";
}, {
    type: "tick";
}>;

declare type FootprintData = {
    vehicleCO2Tons: number;
    spaceHeatingCO2Tons: number;
    gridElectricityCO2Tons: number;
};
declare type FootprintUpdateInfo = {
    type: "update";
    footprintData: FootprintData;
};
declare const decarbLiveView: liveviewjs.LiveView<{
    footprintData?: FootprintData | undefined;
}, AnyLiveEvent, FootprintUpdateInfo>;

/**
 * Example that loads a today's comic from xkcd.com and allows paginating and loading
 * random comics from the same site.
 */
declare const xkcdLiveView: liveviewjs.LiveView<liveviewjs.AnyLiveContext, liveviewjs.AnyLiveEvent, liveviewjs.AnyLiveInfo>;

declare const helloNameLiveView: liveviewjs.LiveView<liveviewjs.AnyLiveContext, liveviewjs.AnyLiveEvent, liveviewjs.AnyLiveInfo>;

declare const helloToggleEmojiLiveView: liveviewjs.LiveView<liveviewjs.AnyLiveContext, liveviewjs.AnyLiveEvent, liveviewjs.AnyLiveInfo>;

declare type MyContext = {
    count: number;
};
declare type MyEvent = {
    type: "increment";
} | {
    type: "decrement";
};
/**
 * Example of a LiveView using JS Commands
 */
declare const jsCmdsLiveView: liveviewjs.LiveView<MyContext, MyEvent, liveviewjs.AnyLiveInfo>;

/**
 * Example showing how to use server-side live navigation.
 */
declare const liveNavLV: liveviewjs.LiveView<{
    id?: string | undefined;
}, {
    type: "patch";
    id: string;
} | {
    type: "redirect";
    path: string;
}, liveviewjs.AnyLiveInfo>;

declare const searchLiveView: liveviewjs.LiveView<{
    zip: string;
    stores: Store[];
    loading: boolean;
}, {
    type: "zip-search";
    zip: string;
}, {
    type: "run_zip_search";
    zip: string;
}>;

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
declare const paginateLiveView: liveviewjs.LiveView<{
    options: Options;
    donations: Donation$1[];
}, {
    type: "select-per-page";
    perPage: string;
}, liveviewjs.AnyLiveInfo>;

declare type PhotosContext = {
    photoGroups: PhotoGroup[];
    changeset: LiveViewChangeset<PhotoGroup>;
};
declare type PhotosEvents = {
    type: "validate";
    name: string;
} | {
    type: "save";
    name: string;
    urls: string[];
} | {
    type: "cancel";
    config_name: string;
    ref: string;
};
declare const photosLiveView: liveviewjs.LiveView<PhotosContext, PhotosEvents, liveviewjs.AnyLiveInfo>;
declare const PhotoGroupSchema: z.ZodObject<{
    id: z.ZodDefault<z.ZodString>;
    name: z.ZodString;
    urls: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    urls: string[];
}, {
    id?: string | undefined;
    urls?: string[] | undefined;
    name: string;
}>;
declare type PhotoGroup = z.infer<typeof PhotoGroupSchema>;

declare type PhotoSize = "4x6" | "5x7" | "8x10" | "10x13" | "11x14";
declare const printLiveView: liveviewjs.LiveView<{
    photoSizeIndex: number;
    photoSize: PhotoSize;
    cost: number;
}, {
    type: "update";
    photoSizeIndex: string;
}, liveviewjs.AnyLiveInfo>;

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

declare const serversLiveView: liveviewjs.LiveView<{
    servers: Server[];
    selectedServer: Server;
}, {
    type: "select";
    id: string;
}, liveviewjs.AnyLiveInfo>;

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
declare const sortLiveView: liveviewjs.LiveView<{
    options: PaginateOptions & SortOptions;
    donations: Donation[];
}, {
    type: "select-per-page";
    perPage: string;
} | {
    type: "change-sort";
    sortby: string;
    sortOrder: string;
}, liveviewjs.AnyLiveInfo>;

/**
 * Simulates a UI to control the volume using buttons and keyboard input.
 */
declare const volumeLiveView: liveviewjs.LiveView<{
    volume: number;
}, {
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
}, liveviewjs.AnyLiveInfo>;

declare const VolunteerSchema: z.ZodObject<{
    id: z.ZodDefault<z.ZodString>;
    name: z.ZodString;
    phone: z.ZodString;
    checked_out: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    checked_out: boolean;
    phone: string;
}, {
    id?: string | undefined;
    checked_out?: boolean | undefined;
    name: string;
    phone: string;
}>;
declare type Volunteer = z.infer<typeof VolunteerSchema>;
declare type VolunteerMutationInfo = {
    type: "created";
    volunteer: Volunteer;
} | {
    type: "updated";
    volunteer: Volunteer;
};

declare const volunteerLiveView: liveviewjs.LiveView<{
    volunteers: Volunteer[];
    changeset: LiveViewChangeset<Volunteer>;
}, {
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
}, VolunteerMutationInfo>;

interface RouteDetails {
    label: string;
    path: string;
    gitPath?: string;
    summary: string;
    tags: string[];
}
declare const routeDetails: RouteDetails[];

export { FootprintData, FootprintUpdateInfo, PaginateOptions, RouteDetails, SortOptions, autocompleteLiveView, booksLiveView, counterLiveView, dashboardLiveView, decarbLiveView, helloNameLiveView, helloToggleEmojiLiveView, jsCmdsLiveView, liveNavLV, paginateLiveView, photosLiveView, printLiveView, routeDetails, rtCounterLiveView, searchLiveView, serversLiveView, sortLiveView, volumeLiveView, volunteerLiveView, xkcdLiveView };
