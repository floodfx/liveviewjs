export interface Donation {
  id: string;
  emoji: string;
  item: string;
  quantity: number;
  days_until_expires: number;
}

const items = [
  { emoji: "☕️", item: "Coffee" },
  { emoji: "🥛", item: "Milk" },
  { emoji: "🥩", item: "Beef" },
  { emoji: "🍗", item: "Chicken" },
  { emoji: "🍖", item: "Pork" },
  { emoji: "🍗", item: "Turkey" },
  { emoji: "🥔", item: "Potatoes" },
  { emoji: "🥣", item: "Cereal" },
  { emoji: "🥣", item: "Oatmeal" },
  { emoji: "🥚", item: "Eggs" },
  { emoji: "🥓", item: "Bacon" },
  { emoji: "🧀", item: "Cheese" },
  { emoji: "🥬", item: "Lettuce" },
  { emoji: "🥒", item: "Cucumber" },
  { emoji: "🐠", item: "Smoked Salmon" },
  { emoji: "🐟", item: "Tuna" },
  { emoji: "🐡", item: "Halibut" },
  { emoji: "🥦", item: "Broccoli" },
  { emoji: "🧅", item: "Onions" },
  { emoji: "🍊", item: "Oranges" },
  { emoji: "🍯", item: "Honey" },
  { emoji: "🍞", item: "Sourdough Bread" },
  { emoji: "🥖", item: "French Bread" },
  { emoji: "🍐", item: "Pear" },
  { emoji: "🥜", item: "Nuts" },
  { emoji: "🍎", item: "Apples" },
  { emoji: "🥥", item: "Coconut" },
  { emoji: "🧈", item: "Butter" },
  { emoji: "🧀", item: "Mozzarella" },
  { emoji: "🍅", item: "Tomatoes" },
  { emoji: "🍄", item: "Mushrooms" },
  { emoji: "🍚", item: "Rice" },
  { emoji: "🍜", item: "Pasta" },
  { emoji: "🍌", item: "Banana" },
  { emoji: "🥕", item: "Carrots" },
  { emoji: "🍋", item: "Lemons" },
  { emoji: "🍉", item: "Watermelons" },
  { emoji: "🍇", item: "Grapes" },
  { emoji: "🍓", item: "Strawberries" },
  { emoji: "🍈", item: "Melons" },
  { emoji: "🍒", item: "Cherries" },
  { emoji: "🍑", item: "Peaches" },
  { emoji: "🍍", item: "Pineapples" },
  { emoji: "🥝", item: "Kiwis" },
  { emoji: "🍆", item: "Eggplants" },
  { emoji: "🥑", item: "Avocados" },
  { emoji: "🌶", item: "Peppers" },
  { emoji: "🌽", item: "Corn" },
  { emoji: "🍠", item: "Sweet Potatoes" },
  { emoji: "🥯", item: "Bagels" },
  { emoji: "🥫", item: "Soup" },
  { emoji: "🍪", item: "Cookies" },
];

export const donations: Donation[] = items.map((item, id) => {
  const quantity = Math.floor(Math.random() * 20) + 1;
  const days_until_expires = Math.floor(Math.random() * 30) + 1;
  return { ...item, quantity, days_until_expires, id: (id + 1).toString() };
});

export const listItems = (page: number, perPage: number) => {
  return donations.slice((page - 1) * perPage, page * perPage);
};

export const almostExpired = (donation: Donation) => donation.days_until_expires <= 10;
