// --- DOM Elements ---
const aiAssistantTrigger = document.getElementById('ai-assistant-trigger');
const aiAssistantPanel = document.getElementById('ai-assistant-panel');
const aiCloseButton = document.getElementById('ai-close-button');
const overlay = document.getElementById('overlay');
const aiChatArea = document.getElementById('ai-chat-area');
const aiUserInput = document.getElementById('ai-user-input');
const aiSendButton = document.getElementById('ai-send-button');
const aiTypingIndicator = document.getElementById('ai-typing-indicator');
const sidebarNav = document.getElementById('sidebar-nav');
const mainContent = document.getElementById('main-content');
const mainHeaderTitle = document.getElementById('main-header-title');
const timePeriodButtons = document.querySelectorAll('.time-period-btn');
const statsDisplay = document.getElementById('stats-display');
const energyFlowContainer = document.getElementById('energy-flow');

// --- Initial State ---
let activeSection = 'overview-section';
let aiChatHistory = [];

// --- Sidebar Navigation ---
sidebarNav.addEventListener('click', (e) => {
    const link = e.target.closest('.sidebar-link');
    if (!link) return;
    e.preventDefault();
    const sectionId = link.dataset.section;
    if (!sectionId || sectionId === activeSection) return;

    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('sidebar-link-active', 'bg-gray-700', 'text-white'));
    link.classList.add('sidebar-link-active', 'bg-gray-700', 'text-white');

    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    const newSection = document.getElementById(sectionId);
    if (newSection) {
        newSection.classList.add('active');
        activeSection = sectionId;
        mainHeaderTitle.textContent = link.querySelector('span').textContent + (sectionId === 'overview-section' ? ' Overview' : '');
        // Recalculate flow on tab switch if energy tab is active
        if (activeSection === 'energy-section') {
            setTimeout(updateEnergyFlowVisualization, 50); // Delay slightly for layout reflow
        }
    } else {
         console.warn(`Section with ID ${sectionId} not found. Falling back to overview.`);
         document.getElementById('overview-section').classList.add('active');
         document.querySelector('[data-section="overview-section"]').classList.add('sidebar-link-active', 'bg-gray-700', 'text-white');
         activeSection = 'overview-section';
         mainHeaderTitle.textContent = 'Home Overview';
    }
});

function setInitialActiveLink() {
    const initialLink = document.querySelector(`.sidebar-link[data-section="${activeSection}"]`);
    if (initialLink) initialLink.classList.add('sidebar-link-active', 'bg-gray-700', 'text-white');
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    const initialSection = document.getElementById(activeSection);
    if (initialSection) initialSection.classList.add('active');
}

// --- Energy Flow Visualization Logic ---
function updateEnergyFlowVisualization(liveData = { solar: 4.7, grid: -0.5, battery: -2.0, home: 3.2, evCharge: 1.5, batterySoc: 75 }) {
     if (!energyFlowContainer) return;

    const nodes = {
        solar: document.getElementById('node-solar'),
        grid: document.getElementById('node-grid'),
        home: document.getElementById('node-home'),
        battery: document.getElementById('node-battery'),
        ev: document.getElementById('node-ev')
    };

    // Get SVG Path elements  
    const paths = {
        solarHome: document.getElementById('path-solar-home'),
        batteryHome: document.getElementById('path-battery-home'),
        evHome: document.getElementById('path-ev-home'),
        gridHome: document.getElementById('path-grid-home')
    };

    if (!paths.solarHome || !paths.batteryHome || !paths.evHome || !paths.gridHome) {
        console.error('Energy flow path elements not found');
        return;
    }

    // --- Helper function to get node center relative to container ---
    function getNodeCenter(node) {
        if (!node) return { x: 0, y: 0 };
        const containerRect = energyFlowContainer.getBoundingClientRect();
        const nodeRect = node.getBoundingClientRect();
        // Calculate center relative to the container's top-left corner
        const x = (nodeRect.left + nodeRect.right) / 2 - containerRect.left;
        const y = (nodeRect.top + nodeRect.bottom) / 2 - containerRect.top;
        return { x, y };
    }

    // --- Helper function to draw/update SVG path ---
    function drawPath(pathElem, startNode, endNode, flowClass, reverse = false, type = 'curve') {
        if (!pathElem || !startNode || !endNode) {
            console.error('Missing required elements for drawing path');
            return;
        }

        const start = getNodeCenter(startNode);
        const end = getNodeCenter(endNode);
        
        // Ensure we have valid coordinates
        if (isNaN(start.x) || isNaN(start.y) || isNaN(end.x) || isNaN(end.y)) {
            console.error('Invalid coordinates for path', { start, end });
            return;
        }

        let d = "";
        if (type === 'curve') {
            // Quadratic Bezier curve with explicit control point
            const midX = (start.x + end.x) / 2;
            const controlY = start.y + (end.y - start.y) * 0.1;
            d = `M${start.x},${start.y} Q${midX},${controlY} ${end.x},${end.y}`;
        } else {
            // Straight line with explicit coordinates
            d = `M${start.x},${start.y} L${end.x},${end.y}`;
        }

        // Set path attributes directly
        pathElem.setAttribute('d', d);
        pathElem.setAttribute('stroke-width', '4');
        pathElem.setAttribute('fill', 'none');
        pathElem.setAttribute('stroke-dasharray', '10 10');
        pathElem.setAttribute('stroke-linecap', 'round');
        
        // Set class and style for color and animation
        pathElem.setAttribute('class', `energy-path active ${flowClass} ${reverse ? 'reverse' : ''}`);
        
        // For browsers that might have issues with CSS animations on SVG
        pathElem.style.opacity = '1';
        
        // Set stroke color directly as a fallback
        if (flowClass === 'flow-solar') pathElem.setAttribute('stroke', '#f59e0b');
        else if (flowClass === 'flow-grid-import') pathElem.setAttribute('stroke', '#ef4444');
        else if (flowClass === 'flow-grid-export') pathElem.setAttribute('stroke', '#10b981');
        else if (flowClass === 'flow-battery-charge') pathElem.setAttribute('stroke', '#3b82f6');
        else if (flowClass === 'flow-battery-discharge') pathElem.setAttribute('stroke', '#a855f7');
        else if (flowClass === 'flow-ev-charge') pathElem.setAttribute('stroke', '#22c55e');
    }

    // --- Reset paths ---
    Object.values(paths).forEach(path => {
        if (path) {
            path.className.baseVal = 'energy-path'; // Reset class list
            path.setAttribute('d', ''); // Clear path data
        }
    });


    // --- Update Node Values (includes EV and Battery value) ---
    document.getElementById('solar-value').textContent = `${Math.abs(liveData.solar).toFixed(1)} kW`;
    document.getElementById('home-value').textContent = `${Math.abs(liveData.home).toFixed(1)} kW`;
    document.getElementById('battery-soc').textContent = `${liveData.batterySoc}%`;
    document.getElementById('ev-value').textContent = `${Math.abs(liveData.evCharge).toFixed(1)} kW`; // Update EV value

    // Grid value and icon/color
    const gridValueElem = document.getElementById('grid-value');
    const gridIconElem = document.querySelector('#node-grid i');
    if (liveData.grid < -0.05) { // Import
        gridValueElem.textContent = `Import ${Math.abs(liveData.grid).toFixed(1)} kW`;
        gridIconElem.className = 'fas fa-broadcast-tower text-red-500';
    } else if (liveData.grid > 0.05) { // Export
        gridValueElem.textContent = `Export ${liveData.grid.toFixed(1)} kW`;
         gridIconElem.className = 'fas fa-broadcast-tower text-green-500';
    } else {
         gridValueElem.textContent = `0.0 kW`;
         gridIconElem.className = 'fas fa-broadcast-tower text-gray-500';
    }

     // Battery value and icon/color
    const batteryValueElem = document.getElementById('battery-value'); // Get battery value element
    const batteryIconElem = document.querySelector('#node-battery i');
     if (liveData.battery < -0.05) { // Charging
        batteryValueElem.textContent = `Charging ${Math.abs(liveData.battery).toFixed(1)} kW`;
        batteryIconElem.className = `fas ${getBatteryIconClass(liveData.batterySoc)} text-blue-500`;
    } else if (liveData.battery > 0.05) { // Discharging
        batteryValueElem.textContent = `Discharge ${liveData.battery.toFixed(1)} kW`;
         batteryIconElem.className = `fas ${getBatteryIconClass(liveData.batterySoc)} text-purple-500`;
    } else {
         batteryValueElem.textContent = `0.0 kW`;
         batteryIconElem.className = `fas ${getBatteryIconClass(liveData.batterySoc)} text-gray-500`;
    }

    // EV value and icon/color
    const evValueElem = document.getElementById('ev-value');
    const evIconElem = document.querySelector('#node-ev i');
    if (liveData.evCharge > 0.05) { // Charging
        evIconElem.className = 'fas fa-car-battery text-green-500';
    } else {
        evIconElem.className = 'fas fa-car-battery text-gray-500';
    }


    // --- Draw Active Flows using SVG Paths ---
    const threshold = 0.05;

    // Solar to Home (Curved)
    if (liveData.solar > threshold) {
         // Simplified: Assume all solar goes to home for now
         drawPath(paths.solarHome, nodes.solar, nodes.home, 'flow-solar', false, 'curve');
    }

    // Grid to Home (Import - Straight, Reverse Animation)
    if (liveData.grid < -threshold) {
         drawPath(paths.gridHome, nodes.grid, nodes.home, 'flow-grid-import', true, 'straight');
    }
    // Home to Grid (Export - Straight, Forward Animation)
    else if (liveData.grid > threshold) {
         drawPath(paths.gridHome, nodes.home, nodes.grid, 'flow-grid-export', false, 'straight');
    }

    // Battery to Home (Discharge - Curved, Forward Animation)
    if (liveData.battery > threshold) {
         drawPath(paths.batteryHome, nodes.battery, nodes.home, 'flow-battery-discharge', false, 'curve');
    }
    // Home to Battery (Charge - Curved, Reverse Animation)
    else if (liveData.battery < -threshold) {
         drawPath(paths.batteryHome, nodes.home, nodes.battery, 'flow-battery-charge', true, 'curve');
    }

    // Home to EV (Charging - Curved, Forward Animation)
    if (liveData.evCharge > threshold) {
        drawPath(paths.evHome, nodes.home, nodes.ev, 'flow-ev-charge', false, 'curve');
    }
}

// Helper to get battery icon class based on State of Charge (SoC)
function getBatteryIconClass(soc) {
    if (soc > 85) return 'fa-battery-full';
    if (soc > 60) return 'fa-battery-three-quarters';
    if (soc > 35) return 'fa-battery-half';
    if (soc > 10) return 'fa-battery-quarter';
    return 'fa-battery-empty';
}

// --- Energy Data State ---
let hemsEnergyData = [];
let energyData = [];

// Map HEMS fields to expected keys
function mapHEMSData(raw) {
    return {
        timestamp: raw.Time || raw.timestamp || raw.time || raw.date || '',
        home: raw.Consumption || 0,
        solar: raw.Production || 0,
        batterySoc: raw["Storage Level"] || 0,
        battery: 0, // Not available in raw, set to 0 or compute if possible
        grid: (raw["Grid Import"] || 0) + (raw["Grid Export"] || 0),
        fromGrid: raw["Grid Import"] || 0,
        toGrid: raw["Grid Export"] || 0,
        evCharge: 0, // Not available in raw, set to 0 or compute if possible
        evLevel: raw["EV Level"] || 0,
        evAvailable: raw["EV Available"] || 0
    };
}

// Fetch HEMS data from backend API
async function fetchEnergyData() {
    try {
        const res = await fetch('/api/energy-data/energy-data');
        const rawData = await res.json();
        hemsEnergyData = Array.isArray(rawData) ? rawData.map(mapHEMSData) : [];
        processEnergyData();
    } catch (err) {
        console.error('Failed to fetch HEMS energy data:', err);
    }
}

// Process and aggregate HEMS data for UI (rolling timeseries, ignore real dates)
function processEnergyData() {
    if (!Array.isArray(hemsEnergyData) || hemsEnergyData.length === 0) return;
    // 15min intervals: 96 per day
    const perDay = 96;
    const perWeek = 7 * perDay;
    const perMonth = 30 * perDay;
    const total = hemsEnergyData.length;
    function aggregate(dataArr) {
        if (!dataArr.length) return {};
        let consumption = 0, production = 0, fromGrid = 0, toGrid = 0, batteryCharged = 0, batteryDischarged = 0, evCharged = 0;
        dataArr.forEach(d => {
            consumption += d.home || 0;
            production += d.solar || 0;
            if (d.grid < 0) fromGrid += Math.abs(d.grid);
            if (d.grid > 0) toGrid += d.grid;
            if (d.battery < 0) batteryCharged += Math.abs(d.battery);
            if (d.battery > 0) batteryDischarged += d.battery;
            evCharged += d.evCharge || 0;
        });
        const last = dataArr[dataArr.length - 1];
        return {
            consumption, production, fromGrid, toGrid, batteryCharged, batteryDischarged, evCharged,
            chartLabel: '',
            batterySoc: last?.batterySoc || 0,
            live: last || {}
        };
    }
    energyData = {
        today: { ...aggregate(hemsEnergyData.slice(-perDay)), chartLabel: 'Hourly Usage (Today)' },
        week: { ...aggregate(hemsEnergyData.slice(-perWeek)), chartLabel: 'Daily Usage (Last Week)' },
        month: { ...aggregate(hemsEnergyData.slice(-perMonth)), chartLabel: 'Daily Usage (Last Month)' }
    };
}

// --- Chart.js Setup ---
let energyChart = null;
function renderEnergyChart(period) {
    const chartContainer = document.querySelector('.chart-placeholder');
    if (!chartContainer) return;
    chartContainer.innerHTML = '<canvas id="energy-chart" style="width:100%;height:100%;max-width:100%;max-height:100%;"></canvas>';
    const ctx = document.getElementById('energy-chart').getContext('2d');
    let labels = [], consumption = [], production = [];
    if (period === 'today') {
        // Last 24h (96 points)
        const dataArr = hemsEnergyData.slice(-96);
        labels = dataArr.map((d, i) => d.timestamp ? d.timestamp.slice(11, 16) : i);
        consumption = dataArr.map(d => d.home ?? 0);
        production = dataArr.map(d => d.solar ?? 0);
    } else if (period === 'week' || period === 'month') {
        // Aggregate by day for week/month, but handle if not enough data
        const perDay = 96;
        const days = period === 'week' ? 7 : 30;
        const totalDays = Math.floor(hemsEnergyData.length / perDay);
        const usedDays = Math.min(days, totalDays);
        const dataArr = hemsEnergyData.slice(-usedDays * perDay);
        for (let i = 0; i < usedDays; i++) {
            const daySlice = dataArr.slice(i * perDay, (i + 1) * perDay);
            labels.push('Day ' + (i + 1));
            consumption.push(daySlice.reduce((sum, d) => sum + (d.home ?? 0), 0));
            production.push(daySlice.reduce((sum, d) => sum + (d.solar ?? 0), 0));
        }
    }
    if (energyChart) energyChart.destroy();
    // Calculate min/max for y-axis for better scaling
    const allY = [...consumption, ...production];
    let minY = Math.min(...allY);
    let maxY = Math.max(...allY);
    let yPadding = (maxY - minY) * 0.1 || 1;
    // Debug: Log minY, maxY, yPadding
    console.log('minY:', minY, 'maxY:', maxY, 'yPadding:', yPadding);
    // Debug: Log chart data before rendering
    // console.log('Chart labels:', labels);
    // console.log('Consumption:', consumption);
    // console.log('Production:', production);
    if (labels.length === 0 || (consumption.every(v => v === 0) && production.every(v => v === 0))) {
        ctx.font = '16px sans-serif';
        ctx.fillText('No data available for this period.', 20, 40);
        return;
    }
    energyChart = new Chart(ctx, {
        type: 'line', // Always use line chart for better visibility
        data: {
            labels,
            datasets: [
                {
                    label: 'Consumption',
                    data: consumption,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.15)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    borderWidth: 3
                },
                {
                    label: 'Production',
                    data: production,
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245,158,11,0.15)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    borderWidth: 3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#374151',
                        font: { size: 14, weight: 'bold' },
                        padding: 20
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: '#111827',
                    titleColor: '#f59e0b',
                    bodyColor: '#fff',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y?.toFixed(2) ?? 0} kWh`;
                        }
                    }
                },
                title: {
                    display: true,
                    text: period === 'today' ? 'Last 24 Hours (15min intervals)' : `Last ${labels.length} Days`,
                    color: '#111827',
                    font: { size: 18, weight: 'bold' },
                    padding: { top: 10, bottom: 20 }
                }
            },
            scales: {
                x: {
                    ticks: { color: '#6b7280', font: { size: 12 } },
                    grid: { color: 'rgba(209,213,219,0.2)' }
                },
                y: {
                    min: minY - yPadding,
                    max: maxY + yPadding,
                    ticks: { color: '#6b7280', font: { size: 12 } },
                    grid: { color: 'rgba(209,213,219,0.2)' }
                }
            },
            animation: {
                duration: 900,
                easing: 'easeOutQuart'
            },
            layout: {
                padding: 20
            }
        }
    });
}

// Override displayEnergyStats to use dynamic data
function displayEnergyStats(period) {
    const data = energyData[period];
    if (!data) return;
    statsDisplay.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200"> <h3 class="text-md font-semibold text-gray-600 mb-2 flex items-center"><i class="fas fa-home mr-2 text-green-500"></i>Consumption</h3> <p class="text-2xl font-bold text-gray-800">${data.consumption?.toFixed(1) || 0} <span class="text-lg font-normal">kWh</span></p> <p class="text-xs text-gray-500 mt-1">From Grid: ${data.fromGrid?.toFixed(1) || 0} kWh</p> </div>
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200"> <h3 class="text-md font-semibold text-gray-600 mb-2 flex items-center"><i class="fas fa-solar-panel mr-2 text-yellow-500"></i>Production</h3> <p class="text-2xl font-bold text-gray-800">${data.production?.toFixed(1) || 0} <span class="text-lg font-normal">kWh</span></p> <p class="text-xs text-gray-500 mt-1">To Grid: ${data.toGrid?.toFixed(1) || 0} kWh</p> </div>
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200"> <h3 class="text-md font-semibold text-gray-600 mb-2 flex items-center"><i class="fas fa-battery-half mr-2 text-blue-500"></i>Battery</h3> <p class="text-lg font-semibold text-gray-800">Charged: ${data.batteryCharged?.toFixed(1) || 0} kWh</p> <p class="text-lg font-semibold text-gray-800">Discharged: ${data.batteryDischarged?.toFixed(1) || 0} kWh</p> </div>
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200"> <h3 class="text-md font-semibold text-gray-600 mb-2 flex items-center"><i class="fas fa-car-battery mr-2 text-green-500"></i>EV Charging</h3> <p class="text-2xl font-bold text-gray-800">${(data.evCharged || 0).toFixed(1)} <span class="text-lg font-normal">kWh</span></p> <p class="text-xs text-gray-500 mt-1">Total for period</p></div>
            <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 md:col-span-2"> <h3 class="text-md font-semibold text-gray-600 mb-2 flex items-center"><i class="fas fa-chart-line mr-2 text-indigo-500"></i>Summary</h3> <p class="text-lg font-semibold text-gray-800">Net Grid: ${(data.toGrid - data.fromGrid).toFixed(1)} kWh ${data.toGrid > data.fromGrid ? '(Export)' : '(Import)'}</p> <p class="text-lg font-semibold text-gray-800">Self-Sufficiency: ${data.consumption > 0 ? Math.min(100, ((data.production - data.toGrid + data.batteryDischarged) / data.consumption) * 100).toFixed(0) : 0}%</p> </div>
        </div>
    `;
    if (data.live) {
        updateEnergyFlowVisualization(data.live);
    }
    renderEnergyChart(period);
}

// --- User Profile Logic ---
const defaultProfile = {
    userName: '',
    family: [],
    activeMember: ''
};
function loadUserProfile() {
    try {
        return JSON.parse(localStorage.getItem('ecoHomeUserProfile')) || { ...defaultProfile };
    } catch {
        return { ...defaultProfile };
    }
}
function saveUserProfile(profile) {
    localStorage.setItem('ecoHomeUserProfile', JSON.stringify(profile));
}
function renderFamilyMembers(profile) {
    const list = document.getElementById('family-members-list');
    list.innerHTML = '';
    profile.family.forEach((member, idx) => {
        const div = document.createElement('div');
        div.className = 'flex items-center space-x-2 mb-2';
        div.innerHTML = `
            <input type="text" class="border rounded px-2 py-1 w-32" placeholder="Name" value="${member.name}" data-idx="${idx}" data-field="name" />
            <input type="number" class="border rounded px-2 py-1 w-16" placeholder="Age" value="${member.age}" data-idx="${idx}" data-field="age" min="0" />
            <select class="border rounded px-2 py-1" data-idx="${idx}" data-field="gender">
                <option value="male" ${member.gender === 'male' ? 'selected' : ''}>Male</option>
                <option value="female" ${member.gender === 'female' ? 'selected' : ''}>Female</option>
                <option value="other" ${member.gender === 'other' ? 'selected' : ''}>Other</option>
            </select>
            <button type="button" class="remove-family-member bg-red-500 text-white px-2 py-1 rounded" data-idx="${idx}"><i class="fas fa-trash"></i></button>
        `;
        list.appendChild(div);
    });
}
function renderActiveMemberSelect(profile) {
    const select = document.getElementById('active-family-member');
    select.innerHTML = '';
    profile.family.forEach((member, idx) => {
        const opt = document.createElement('option');
        opt.value = member.name;
        opt.textContent = `${member.name} (${member.age}, ${member.gender})`;
        if (profile.activeMember === member.name) opt.selected = true;
        select.appendChild(opt);
    });
}
function updateProfileFromForm(profile) {
    profile.userName = document.getElementById('user-name').value.trim();
    // Update family members
    const fields = document.querySelectorAll('#family-members-list [data-idx]');
    fields.forEach(field => {
        const idx = +field.dataset.idx;
        const key = field.dataset.field;
        if (key === 'age') profile.family[idx][key] = parseInt(field.value, 10) || 0;
        else profile.family[idx][key] = field.value;
    });
    // Update active member
    const select = document.getElementById('active-family-member');
    profile.activeMember = select.value;
}
function setupUserProfileUI() {
    const profile = loadUserProfile();
    document.getElementById('user-name').value = profile.userName;
    renderFamilyMembers(profile);
    renderActiveMemberSelect(profile);
    // Add member
    document.getElementById('add-family-member').onclick = () => {
        profile.family.push({ name: '', age: '', gender: 'male' });
        renderFamilyMembers(profile);
        renderActiveMemberSelect(profile);
    };
    // Remove member
    document.getElementById('family-members-list').onclick = e => {
        if (e.target.closest('.remove-family-member')) {
            const idx = +e.target.closest('.remove-family-member').dataset.idx;
            profile.family.splice(idx, 1);
            renderFamilyMembers(profile);
            renderActiveMemberSelect(profile);
        }
    };
    // Update on input
    document.getElementById('family-members-list').oninput = () => {
        updateProfileFromForm(profile);
        renderActiveMemberSelect(profile);
    };
    document.getElementById('active-family-member').onchange = () => {
        updateProfileFromForm(profile);
    };
    // Save
    document.getElementById('user-profile-form').onsubmit = e => {
        e.preventDefault();
        updateProfileFromForm(profile);
        saveUserProfile(profile);
        alert('Profile saved!');
    };
}
window.addEventListener('DOMContentLoaded', setupUserProfileUI);

// --- AI Chat Logic ---
function handleAIUserInput() {
    const userMessage = aiUserInput.value.trim();
    if (!userMessage) return;
    displayAIMessage(userMessage, 'user');
    aiUserInput.value = '';
    aiChatHistory.push({ role: 'user', content: userMessage });
    toggleAIInput(false);
    showAITypingIndicator(true); // Show typing indicator immediately
    simulateAIResponse(userMessage); // Don't use setTimeout, call directly
}

function formatAIText(text) {
    // Convert markdown bold **text** to <b>text</b>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    // Convert markdown-style unordered lists to <ul><li>...</li></ul>
    // - ...
    formatted = formatted.replace(/(?:^|\n)[ \t]*- (.*?)(?=\n|$)/g, (match, item) => `<li>${item.trim()}</li>`);
    // Wrap <li> in <ul> if any <li> present
    if (/<li>/.test(formatted)) {
        formatted = formatted.replace(/(<li>[\s\S]*<\/li>)/g, '<ul>$1</ul>');
    }
    // Convert numbered lists 1. ...
    formatted = formatted.replace(/(?:^|\n)[ \t]*\d+\. (.*?)(?=\n|$)/g, (match, item) => `<li>${item.trim()}</li>`);
    if (/<li>/.test(formatted)) {
        formatted = formatted.replace(/(<li>[\s\S]*<\/li>)/g, '<ol>$1</ol>');
    }
    // Convert remaining newlines to <br>
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
}

function displayAIMessage(text, sender, options = null) {
    const formatted = formatAIText(text);
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-message flex ${sender === 'user' ? 'justify-end' : ''}`;
    if (sender === 'user') {
        msgDiv.innerHTML = `<div class='bg-teal-600 text-white p-3 rounded-lg rounded-tr-none max-w-xs shadow ml-auto'><p class='text-sm'>${formatted}</p></div>`;
    } else {
        msgDiv.innerHTML = `<div class='flex-shrink-0 mr-3'><div class='w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold'><i class='fas fa-leaf text-sm'></i></div></div><div class='bg-teal-100 text-gray-800 p-3 rounded-lg rounded-tl-none max-w-xs shadow'><p class='text-sm'>${formatted}</p></div>`;
        aiChatHistory.push({ role: 'assistant', content: text });
    }
    aiChatArea.appendChild(msgDiv);
    aiChatArea.scrollTop = aiChatArea.scrollHeight;
    if (options && Array.isArray(options)) {
        const btnRow = document.createElement('div');
        btnRow.className = 'flex gap-2 mt-2';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'ai-action-button bg-teal-500 hover:bg-teal-600 text-white rounded';
            btn.textContent = opt.label;
            btn.onclick = () => {
                displayAIMessage(opt.label, 'user');
                toggleAIInput(false);
                showAITypingIndicator(true);
                setTimeout(() => {
                    if (opt.action) opt.action();
                    else simulateAIResponse(opt.label);
                }, 700);
            };
            btnRow.appendChild(btn);
        });
        msgDiv.appendChild(btnRow);
    }
}

function showAITypingIndicator(show) {
    aiTypingIndicator.classList.toggle('hidden', !show);
}

function toggleAIInput(enabled) {
    aiUserInput.disabled = !enabled;
    aiSendButton.disabled = !enabled;
}

async function simulateAIResponse(userMessage) {
    showAITypingIndicator(true); // Keep indicator visible during fetch
    const context = {
        now: "2025-04-30 12:45:00",
        hemsEnergyData
    };
    // Add user profile to context
    context.userProfile = loadUserProfile();
    try {
        const res = await fetch('/api/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userMessage, context, history: aiChatHistory })
        });
        const data = await res.json();
        showAITypingIndicator(false); // Hide indicator after response
        toggleAIInput(true);
        if (data.reply) {
            displayAIMessage(data.reply, 'ai');
        } else {
            displayAIMessage('Sorry, I could not get a response from OpenAI.', 'ai');
        }
    } catch (err) {
        showAITypingIndicator(false);
        toggleAIInput(true);
        displayAIMessage('Error contacting OpenAI: ' + err.message, 'ai');
    }
}

// --- AI Panel Toggle ---
function openAIAssistant() {
    aiAssistantPanel.classList.remove('hidden', 'translate-x-full', 'opacity-0', 'pointer-events-none');
    overlay.classList.remove('hidden');
    // Show personalized welcome message
    const profile = loadUserProfile();
    let welcome = 'Hello! I can help optimize your home\'s energy usage.';
    if (profile && profile.activeMember) {
        welcome = `Hello, ${profile.activeMember}! I\'m your personal energy assistant. How can I help you or your family today?`;
    } else if (profile && profile.userName) {
        welcome = `Hello, ${profile.userName}! I\'m your personal energy assistant. How can I help you or your family today?`;
    }
    aiChatArea.innerHTML = `<div class="ai-message flex"><div class="flex-shrink-0 mr-3"><div class="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-white font-bold"><i class="fas fa-leaf text-sm"></i></div></div><div class="bg-teal-100 text-gray-800 p-3 rounded-lg rounded-tl-none max-w-xs shadow"><p class="text-sm">${welcome}</p></div></div>`;
}
function closeAIAssistant() {
    aiAssistantPanel.classList.add('translate-x-full', 'opacity-0', 'pointer-events-none');
    setTimeout(() => { if (aiAssistantPanel.classList.contains('translate-x-full')) { aiAssistantPanel.classList.add('hidden'); } }, 300);
    overlay.classList.add('hidden');
}
aiAssistantTrigger.addEventListener('click', openAIAssistant);
aiCloseButton.addEventListener('click', closeAIAssistant);
overlay.addEventListener('click', closeAIAssistant);

// --- Initial Setup ---
window.addEventListener('load', async () => {
    setInitialActiveLink();
    await fetchEnergyData();
    displayEnergyStats('today');
    toggleAIInput(true);
    setTimeout(() => {
        const currentPeriod = document.querySelector('.time-period-btn.active')?.dataset.period || 'today';
        const liveData = energyData[currentPeriod]?.live || {};
        updateEnergyFlowVisualization(liveData);
    }, 300);
    aiSendButton.addEventListener('click', handleAIUserInput);
    aiUserInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAIUserInput();
    });
});

timePeriodButtons.forEach(button => {
    button.addEventListener('click', () => {
        const period = button.dataset.period;
        timePeriodButtons.forEach(btn => {
            btn.classList.remove('active', 'bg-teal-600', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
        });
        button.classList.add('active', 'bg-teal-600', 'text-white');
        button.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
        displayEnergyStats(period);
    });
});

// Optional: Recalculate flow on window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
         if (activeSection === 'energy-section') {
             const currentPeriod = document.querySelector('.time-period-btn.active')?.dataset.period || 'today';
             const liveData = energyData[currentPeriod]?.live || energyData.today.live;
             updateEnergyFlowVisualization(liveData);
         }
    }, 250); // Debounce resize events
});