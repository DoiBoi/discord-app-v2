const { subWeeks, startOfWeek, endOfWeek } = require("date-fns");
const { ids } = require("./config");
const { supabase } = require("./supabase/supabase_client");

const LOGTABLE = ids.log;
const PERPAGE = 25;

async function appendLog(amount) {
  const { data, error } = await supabase
    .from(LOGTABLE)
    .insert({
      date: new Date().toISOString(),
      amount: amount,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`An error occured in appendLog! ${error.message}`);
  }

  return data;
}

async function getLog(params = {}) {
  let query = supabase.from(LOGTABLE);

  if (Object.hasOwn(params, "week")) {
    query = query.select("*, date, daily_sum:amount.sum()", { count: 'exact' })
    const targetDate = subWeeks(new Date(), params.week);
    query = query
      .gt("date", startOfWeek(targetDate).toISOString())
      .lt("date", endOfWeek(targetDate).toISOString());
  } else {
    query = query.select("*", { count: 'exact' })
  }

  if (Object.hasOwn(params, "date")) {
    query = query.eq("date", params.date);
  }

  if (Object.hasOwn(params, "index")) {
    query = query.range(params.index * PERPAGE, (params.index + 1) * PERPAGE);
  }

  query = query.order("date", { ascending: true });

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`An error occured in getLog ${error.message}`);
  }

  return {data: data, count: Math.floor(count / PERPAGE)};
}

module.exports = {
  appendLog,
  getLog,
};
