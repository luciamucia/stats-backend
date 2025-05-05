const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
const fs = require('fs');
const path = require('path');
const hemsSimulator = require('../hems-simulator/data/hems_results_2025-05-04_15:25:57.json');

// System prompt for the Home Energy Agent
const SYSTEM_PROMPT = `
You are Home Energy Agent, an expert AI assistant for smart home energy management. 
Your main goals are:
- Analyze and optimize home energy usage
- Give actionable recommendations and tips
- Answer questions about energy production, consumption, battery, EV, and grid
- Perform actions for the user (e.g. schedule charging, enable eco mode)
- Always be proactive, clear, and helpful

You have access to the following context data (updated live):
- Solar production: {solar} kW
- Grid usage: {grid} kW
- Battery: {battery} kW, SoC: {batterySoc}%
- EV charging: {evCharge} kW
- Home consumption: {home} kW

If the user asks for optimization, suggest concrete steps or offer to perform them. If the user asks for a report, summarize the current state. If the user asks for an action, confirm and describe the effect. Always use the latest context data.
`;

// In-memory chat history (per session, simple demo)
const chatMemory = {};

function getSessionId(req) {
  // For demo: use IP as session (in production use cookies/auth)
  return req.ip;
}

function aggregateHEMSDaily(hemsEnergyData) {
  // Group by day and sum up metrics
  const daily = {};
  hemsEnergyData.forEach(entry => {
    const day = entry.timestamp ? entry.timestamp.slice(0, 10) : 'unknown';
    if (!daily[day]) daily[day] = {
      date: day,
      home: 0,
      solar: 0,
      batterySoc: 0,
      grid: 0,
      fromGrid: 0,
      toGrid: 0,
      evCharge: 0,
      evLevel: 0,
      evAvailable: 0,
      count: 0
    };
    daily[day].home += entry.home || 0;
    daily[day].solar += entry.solar || 0;
    daily[day].batterySoc += entry.batterySoc || 0;
    daily[day].grid += entry.grid || 0;
    daily[day].fromGrid += entry.fromGrid || 0;
    daily[day].toGrid += entry.toGrid || 0;
    daily[day].evCharge += entry.evCharge || 0;
    daily[day].evLevel += entry.evLevel || 0;
    daily[day].evAvailable += entry.evAvailable || 0;
    daily[day].count++;
  });
  // Average batterySoc, evLevel, evAvailable
  return Object.values(daily).map(day => ({
    date: day.date,
    home: day.home,
    solar: day.solar,
    batterySoc: day.count ? day.batterySoc / day.count : 0,
    grid: day.grid,
    fromGrid: day.fromGrid,
    toGrid: day.toGrid,
    evCharge: day.evCharge,
    evLevel: day.count ? day.evLevel / day.count : 0,
    evAvailable: day.count ? day.evAvailable / day.count : 0
  }));
}

function buildMessages(history, context) {
  // Fill system prompt with context
  let sysPrompt = SYSTEM_PROMPT
    .replace('{solar}', context.solar)
    .replace('{grid}', context.grid)
    .replace('{battery}', context.battery)
    .replace('{batterySoc}', context.batterySoc)
    .replace('{evCharge}', context.evCharge)
    .replace('{home}', context.home);
  // Add user profile if present
  if (context.userProfile) {
    const { userName, family, activeMember } = context.userProfile;
    sysPrompt += `\n\nUser profile:\n- Main user: ${userName || 'unknown'}\n- Family members: ${family && family.length ? family.map(m => `${m.name} (${m.age}, ${m.gender})`).join('; ') : 'none'}\n- The current person interacting with you is: ${activeMember || userName || 'unknown'}\n`;
    sysPrompt += `Always address the current person by name and personalize your responses based on their age and gender if relevant.`;
  }
  // If full HEMS data is present, add only daily aggregates to the system prompt
  if (context.hemsEnergyData && Array.isArray(context.hemsEnergyData) && context.hemsEnergyData.length > 0) {
    const dailyAgg = aggregateHEMSDaily(context.hemsEnergyData);
    sysPrompt += `\n\nHere is the daily aggregated HEMS data as a JSON array. Each entry contains date, home (consumption), solar (production), batterySoc (avg), grid, fromGrid, toGrid, evCharge, evLevel (avg), evAvailable (avg). Use this data to answer historical questions.\nHEMS_DAILY = ${JSON.stringify(dailyAgg)}\n`;
  }
  const messages = [
    { role: 'system', content: sysPrompt }
  ];
  if (history && Array.isArray(history)) {
    messages.push(...history);
  }
  return messages;
}

// Helper: get latest HEMS data for context
function getLatestHEMSContext() {
  try {
    const hemsFilePath = path.join(__dirname, hemsSimulator);
    const data = JSON.parse(fs.readFileSync(hemsFilePath, 'utf8'));
    const arr = data.results || [];
    if (!arr.length) return null;
    const last = arr[arr.length - 1];
    return {
      solar: last.solar || 0,
      grid: last.grid || 0,
      battery: last.battery || 0,
      batterySoc: last.batterySoc || 0,
      evCharge: last.evCharge || 0,
      home: last.home || 0
    };
  } catch (e) {
    return null;
  }
}

async function askOpenAI({ prompt, context, req }) {
  const sessionId = getSessionId(req);
  if (!chatMemory[sessionId]) chatMemory[sessionId] = [];
  // Add user message to memory
  chatMemory[sessionId].push({ role: 'user', content: prompt });
  // Limit memory to last 10 exchanges
  if (chatMemory[sessionId].length > 20) chatMemory[sessionId] = chatMemory[sessionId].slice(-20);

  // Use latest HEMS context if not provided
  let ctx = context;
  if (!ctx) {
    ctx = getLatestHEMSContext() || { solar: 0, grid: 0, battery: 0, batterySoc: 0, evCharge: 0, home: 0 };
  }
  const messages = buildMessages(chatMemory[sessionId], ctx);
  const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  const apiKey = process.env.OPENAI_API_KEY;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 256,
      temperature: 0.7
    })
  });
  const data = await res.json();
  if (data.choices && data.choices[0] && data.choices[0].message) {
    // Add assistant reply to memory
    chatMemory[sessionId].push({ role: 'assistant', content: data.choices[0].message.content });
    // Limit memory
    if (chatMemory[sessionId].length > 20) chatMemory[sessionId] = chatMemory[sessionId].slice(-20);
    return data.choices[0].message.content;
  } else {
    throw new Error(data.error?.message || 'No response from OpenAI');
  }
}

module.exports = { askOpenAI };
