import * as liveviewjs from 'liveviewjs';
import { AnyLiveEvent } from 'liveviewjs';

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
    zip: string;
    city: string;
    stores: Store[];
    matches: string[];
    loading: boolean;
}
declare type Events = {
    type: "zip-search";
    zip: string;
} | {
    type: "city-search";
    city: string;
} | {
    type: "suggest-city";
    city: string;
};
declare type Infos = {
    type: "run_zip_search";
    zip: string;
} | {
    type: "run_city_search";
    city: string;
};
declare const autocompleteLiveView: liveviewjs.LiveView<Context, Events, Infos>;

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

declare type PhotoSize = "4x6" | "5x7" | "8x10" | "10x13" | "11x14";
declare const printLiveView: liveviewjs.LiveView<{
    photoSizeIndex: number;
    photoSize: PhotoSize;
    cost: number;
}, {
    type: "update";
    photoSizeIndex: string;
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

/**
 * Dashboard that automatically refreshes every second or when a user hits refresh.
 */
declare const dashboardLiveView: liveviewjs.LiveView<{
    newOrders: number;
    salesAmount: number;
    rating: number;
}, {
    type: "refresh";
}, {
    type: "tick";
}>;

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

declare const volunteerLiveView: liveviewjs.LiveView<liveviewjs.AnyLiveContext, {
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

interface RouteDetails {
    label: string;
    path: string;
    summary: string;
    tags: string[];
}
declare const routeDetails: RouteDetails[];

export { FootprintData, FootprintUpdateInfo, PaginateOptions, RouteDetails, SortOptions, autocompleteLiveView, counterLiveView, dashboardLiveView, decarbLiveView, paginateLiveView, printLiveView, routeDetails, searchLiveView, serversLiveView, sortLiveView, volumeLiveView, volunteerLiveView };
