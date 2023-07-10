import data from "./citydata.json" assert { type: "json" };

export const isRealCity = (city: string) => {
  // check if the city is real.
  // I have a CSV file of all the cities in the world
  // check if the strnig is in the second column of the CSV file

  return data.map((e) => e.toLowerCase()).includes(city.toLowerCase());
};
