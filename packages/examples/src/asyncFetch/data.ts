import fetch from "node-fetch";

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

export function randomXkcdNum(): number {
  return Math.floor(Math.random() * 2580) + 1;
}

export function isValidXkcd(num: number) {
  // as of 2022-02-14, the latest comic is #2580
  return num >= 1 && num <= 2580;
}

export async function fetchXkcd(num?: number): Promise<XkcdData> {
  let url = "https://xkcd.com/info.0.json";
  if (num && isValidXkcd(num)) {
    url = `https://xkcd.com/${num}/info.0.json`;
  }
  const response = await fetch(url);
  const data = await response.json();
  return data as XkcdData;
}
