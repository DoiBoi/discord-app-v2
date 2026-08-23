const { subWeeks, startOfWeek, endOfWeek } = require("date-fns");
const { ids } = require("./config");
const { supabase } = require("./supabase/supabase_client");

const LOGTABLE = ids.log;
const PERPAGE = 25;
const RPC = ids.log_rpc;

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
  let query = supabase.from(LOGTABLE).select("*", { count: "exact" });

  if (Object.hasOwn(params, "date")) {
    const [day, month, year] = params.date.split('/').map(Number);

    const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);

    const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
    query
      .gte("date", startDate.toISOString())
      .lte("date", endDate.toISOString());
  }

  if (Object.hasOwn(params, "index")) {
    query.range(params.index * PERPAGE, (params.index + 1) * PERPAGE);
  }

  query.order("date", { ascending: true });

  const { data, count, error } = await query;

  if (error) {
    throw new Error(`An error occured in getLog ${error.message}`);
  }

  return { data: data, count: Math.floor(count / PERPAGE) };
}

async function getWeekReport(week = 0) {
  let { data, error } = await supabase.rpc(RPC, {
    week: week,
  });

  if (error) {
    throw new Error(
      `An error occured in getWeekReport ${error.message}\n${error.details}\n${error.hint}`,
    );
  }

  data = data[0];
  console.log(data);
  return { data: data.days, count: data.count - 1 };
}

module.exports = {
  appendLog,
  getLog,
  getWeekReport,
};
