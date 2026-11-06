const config = require("./config");

const URL = "https://ubc-bc-app-1ke5.onrender.com";

async function getNewUsers(names) {
  let names_list = names;
  const bcDate = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "America/Vancouver",
  })
    .format(new Date())
    .replace(/\//g, "-");

  const bcTime = new Date().toLocaleTimeString("en-GB", {
    timeZone: "America/Denver",
  });

  if (!names) {
    try {
      let response = await fetch(
        `${URL}/events/upcoming-and-past?event_date=${bcDate}&event_time=${bcTime}`,
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      let data = await response.json();

      response = await fetch(`${URL}/sign-ups?eid=${data[0][0].eid}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      data = await response.json();

      const members = data.map((item) => {
        return `${item.fname} ${item.lname}`;
      });

      names_list = members;
    } catch (error) {
      console.error("Fetch error:", error);
    }
  }

  const new_players = config.names;
  const stripped_name = names_list.map((item) => {
    return item
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  });

  const filtered = stripped_name.filter((item) => new_players.includes(item));

  return filtered;
}

module.exports = {
  getNewUsers,
};
