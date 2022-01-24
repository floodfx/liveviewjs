
interface LiveTitleTagOptions {
  prefix?: string;
  suffix?: string;
}

export const live_title_tag = (title: string, options?: LiveTitleTagOptions): string => {
  const { prefix = "", suffix = "" } = options || {};
  return `${prefix}${title}${suffix}`;
}