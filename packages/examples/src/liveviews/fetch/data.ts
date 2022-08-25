// see: https://xkcd.com/json.html
export interface XkcdData {
  month: string;
  day: string;
  year: string;
  num: number;
  link: string;
  news: string;
  safe_title: string;
  transcript: string;
  alt: string;
  img: string;
  title: string;
}

export function randomXkcdNum(max: number): number {
  return Math.floor(Math.random() * max) + 1;
}

export function isValidXkcd(num: number, max: number) {
  return num >= 1 && num <= max;
}

export async function fetchXkcd(num?: number, max?: number): Promise<XkcdData> {
  let url = "https://xkcd.com/info.0.json";
  if (num && max && isValidXkcd(num, max)) {
    url = `https://xkcd.com/${num}/info.0.json`;
  }
  const response = await fetch(url);
  const data = await response.json();
  return data as XkcdData;
}
