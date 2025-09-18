// Railway Traffic Optimization Dashboard JavaScript

class RailwayDashboard {
    constructor() {
        this.activeTab = 'overview';
        this.charts = {};
        this.updateInterval = null;
        this.alertsOpen = false;
        
        // Sample data - in a real application, this would come from APIs
        this.data = {
            trains: [
                {
                    id: "12345",
                    name: "Rajdhani Express",
                    route: "New Delhi - Mumbai",
                    status: "On Time",
                    delay: 0,
                    location: "Gwalior Junction",
                    next_station: "Bhopal",
                    eta: "14:25",
                    priority: "High"
                },
                {
                    id: "22691",
                    name: "Habibganj Express",
                    route: "Bhopal - New Delhi",
                    status: "Delayed",
                    delay: 15,
                    location: "Vidisha",
                    next_station: "Bhopal Junction",
                    eta: "13:45",
                    priority: "Medium"
                },
                {
                    id: "12903",
                    name: "Golden Temple Express",
                    route: "Amritsar - Mumbai",
                    status: "On Time",
                    delay: 0,
                    location: "Delhi Junction",
                    next_station: "Mathura",
                    eta: "15:10",
                    priority: "High"
                }
            ],
            conflicts: [
                {
                    id: "C001",
                    type: "Platform Conflict",
                    description: "Trains 12345 and 22691 both scheduled for Platform 2 at Bhopal at 14:30",
                    severity: "High",
                    recommendation: "Reschedule 22691 to Platform 3, delay 5 minutes",
                    status: "Pending"
                },
                {
                    id: "C002",
                    type: "Track Section",
                    description: "Overlapping track usage on Delhi-Mathura section",
                    severity: "Medium",
                    recommendation: "Hold 12903 at Delhi for 8 minutes",
                    status: "Resolved"
                }
            ],
            algorithms: [
                {
                    name: "MILP Optimizer",
                    status: "Running",
                    last_run: "2 minutes ago",
                    success_rate: "94%",
                    avg_time: "45 seconds"
                },
                {
                    name: "Constraint Programming",
                    status: "Idle",
                    last_run: "15 minutes ago",
                    success_rate: "89%",
                    avg_time: "12 seconds"
                },
                {
                    name: "Genetic Algorithm",
                    status: "Available",
                    last_run: "1 hour ago",
                    success_rate: "87%",
                    avg_time: "180 seconds"
                }
            ],
            system_metrics: {
                total_trains: 1247,
                active_conflicts: 3,
                resolved_today: 23,
                system_uptime: "99.8%",
                avg_delay_reduction: "18%",
                optimization_requests: 156
            },
            alerts: [
                {
                    id: "A001",
                    type: "Critical",
                    message: "Signal failure detected at Delhi Junction - immediate attention required",
                    timestamp: "13:45"
                },
                {
                    id: "A002",
                    type: "Warning",
                    message: "Weather alert: Heavy rainfall expected in Mumbai division",
                    timestamp: "13:30"
                },
                {
                    id: "A003",
                    type: "Info",
                    message: "Maintenance window scheduled for 02:00-04:00 tomorrow",
                    timestamp: "13:15"
                }
            ]
        };
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be fully ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }
    
    initializeApp() {
        console.log('Initializing Railway Dashboard...');
        this.setupEventListeners();
        this.updateCurrentTime();
        this.startRealTimeUpdates();
        this.renderTrains();
        this.renderConflicts();
        this.renderAlgorithms();
        this.renderAlerts();
        this.updateMetrics();
        
        // Initialize charts after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.initCharts();
        }, 100);
        
        // Set initial tab
        this.switchTab('overview');
        console.log('Dashboard initialized successfully');
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.target.dataset.tab;
                console.log('Tab clicked:', tab);
                this.switchTab(tab);
            });
        });
        
        // Refresh trains button
        const refreshBtn = document.getElementById('refreshTrains');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('Refresh trains clicked');
                this.refreshTrainData();
            });
        }
        
        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                console.log('Status filter changed:', e.target.value);
                this.filterTrains(e.target.value);
            });
        }
        
        // Run optimization button
        const optimizeBtn = document.getElementById('runOptimization');
        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', () => {
                console.log('Run optimization clicked');
                this.runOptimization();
            });
        }
        
        // Alerts panel
        const alertsTrigger = document.getElementById('alertsTrigger');
        if (alertsTrigger) {
            alertsTrigger.addEventListener('click', () => {
                console.log('Alerts trigger clicked');
                this.toggleAlertsPanel();
            });
        }
        
        const closeAlerts = document.getElementById('closeAlerts');
        if (closeAlerts) {
            closeAlerts.addEventListener('click', () => {
                console.log('Close alerts clicked');
                this.toggleAlertsPanel();
            });
        }
        
        // Conflict resolution buttons (delegated event handling)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('resolve-conflict')) {
                console.log('Resolve conflict clicked:', e.target.dataset.conflictId);
                this.resolveConflict(e.target.dataset.conflictId, 'accept');
            } else if (e.target.classList.contains('reject-conflict')) {
                console.log('Reject conflict clicked:', e.target.dataset.conflictId);
                this.resolveConflict(e.target.dataset.conflictId, 'reject');
            }
        });
        
        console.log('Event listeners set up successfully');
    }
    
    switchTab(tabName) {
        console.log('Switching to tab:', tabName);
        
        // Remove active class from all tabs and buttons
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Activate selected tab and button
        const selectedTab = document.getElementById(tabName);
        const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
        
        if (selectedTab) {
            selectedTab.classList.add('active');
            console.log('Tab activated:', tabName);
        } else {
            console.error('Tab not found:', tabName);
        }
        
        if (selectedBtn) {
            selectedBtn.classList.add('active');
            console.log('Button activated:', tabName);
        } else {
            console.error('Button not found for tab:', tabName);
        }
        
        this.activeTab = tabName;
        
        // Initialize charts for specific tabs
        if (tabName === 'system') {
            setTimeout(() => this.initSystemChart(), 100);
        }
    }
    
    updateCurrentTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour12: false
        });
        const dateString = now.toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = `${dateString} ${timeString}`;
        }
        
        setTimeout(() => this.updateCurrentTime(), 1000);
    }
    
    startRealTimeUpdates() {
        this.updateInterval = setInterval(() => {
            this.simulateDataUpdates();
            this.updateMetrics();
            
            // Update displays if on relevant tabs
            if (this.activeTab === 'monitoring') {
                this.renderTrains();
            }
        }, 10000); // Update every 10 seconds
    }
    
    simulateDataUpdates() {
        // Randomly update train delays
        this.data.trains.forEach(train => {
            if (Math.random() < 0.2) { // 20% chance of delay change
                const change = Math.floor(Math.random() * 6) - 3; // -3 to +3 minutes
                train.delay = Math.max(0, train.delay + change);
                train.status = train.delay > 0 ? "Delayed" : "On Time";
            }
        });
        
        // Update system metrics
        this.data.system_metrics.optimization_requests += Math.floor(Math.random() * 2);
        
        console.log('Data updated');
    }
    
    renderTrains() {
        const container = document.getElementById('trainList');
        if (!container) {
            console.warn('Train list container not found');
            return;
        }
        
        container.innerHTML = '';
        
        this.data.trains.forEach(train => {
            const trainCard = document.createElement('div');
            trainCard.className = `train-card ${train.status.toLowerCase().replace(' ', '')}`;
            
            trainCard.innerHTML = `
                <div class="train-header">
                    <div>
                        <h3 class="train-name">${train.name}</h3>
                        <p class="train-id">Train #${train.id}</p>
                    </div>
                    <span class="train-priority ${train.priority.toLowerCase()}">${train.priority}</span>
                </div>
                <div class="train-details">
                    <div class="train-detail">
                        <span class="detail-label">Route</span>
                        <span class="detail-value">${train.route}</span>
                    </div>
                    <div class="train-detail">
                        <span class="detail-label">Status</span>
                        <span class="detail-value">${train.status}${train.delay > 0 ? ` (+${train.delay}min)` : ''}</span>
                    </div>
                    <div class="train-detail">
                        <span class="detail-label">Current Location</span>
                        <span class="detail-value">${train.location}</span>
                    </div>
                    <div class="train-detail">
                        <span class="detail-label">Next Station</span>
                        <span class="detail-value">${train.next_station}</span>
                    </div>
                    <div class="train-detail">
                        <span class="detail-label">ETA</span>
                        <span class="detail-value">${train.eta}</span>
                    </div>
                </div>
            `;
            
            container.appendChild(trainCard);
        });
        
        console.log('Trains rendered:', this.data.trains.length);
    }
    
    renderConflicts() {
        const container = document.getElementById('conflictsList');
        if (!container) {
            console.warn('Conflicts list container not found');
            return;
        }
        
        container.innerHTML = '';
        
        this.data.conflicts.forEach(conflict => {
            const conflictCard = document.createElement('div');
            conflictCard.className = `conflict-card ${conflict.severity.toLowerCase()}`;
            
            conflictCard.innerHTML = `
                <div class="conflict-header">
                    <div>
                        <h3 class="conflict-type">${conflict.type}</h3>
                        <p class="conflict-id">${conflict.id}</p>
                    </div>
                    <span class="status status--${conflict.severity.toLowerCase() === 'high' ? 'error' : 'warning'}">
                        ${conflict.severity} Priority
                    </span>
                </div>
                <p class="conflict-description">${conflict.description}</p>
                <div class="conflict-recommendation">
                    <div class="recommendation-label">Recommended Action</div>
                    <div class="recommendation-text">${conflict.recommendation}</div>
                </div>
                ${conflict.status === 'Pending' ? `
                    <div class="conflict-actions">
                        <button class="btn btn--primary resolve-conflict" data-conflict-id="${conflict.id}">
                            Accept Recommendation
                        </button>
                        <button class="btn btn--outline reject-conflict" data-conflict-id="${conflict.id}">
                            Reject
                        </button>
                    </div>
                ` : `
                    <div class="status status--success">✓ ${conflict.status}</div>
                `}
            `;
            
            container.appendChild(conflictCard);
        });
        
        console.log('Conflicts rendered:', this.data.conflicts.length);
    }
    
    renderAlgorithms() {
        const container = document.getElementById('algorithmsGrid');
        if (!container) {
            console.warn('Algorithms grid container not found');
            return;
        }
        
        container.innerHTML = '';
        
        this.data.algorithms.forEach(algorithm => {
            const algorithmCard = document.createElement('div');
            algorithmCard.className = 'algorithm-card';
            
            algorithmCard.innerHTML = `
                <div class="algorithm-header">
                    <h3 class="algorithm-name">${algorithm.name}</h3>
                    <span class="algorithm-status ${algorithm.status.toLowerCase()}">${algorithm.status}</span>
                </div>
                <div class="algorithm-metrics">
                    <div class="algorithm-metric">
                        <span class="metric-label">Last Run:</span>
                        <span class="metric-value">${algorithm.last_run}</span>
                    </div>
                    <div class="algorithm-metric">
                        <span class="metric-label">Success Rate:</span>
                        <span class="metric-value">${algorithm.success_rate}</span>
                    </div>
                    <div class="algorithm-metric">
                        <span class="metric-label">Avg Time:</span>
                        <span class="metric-value">${algorithm.avg_time}</span>
                    </div>
                </div>
            `;
            
            container.appendChild(algorithmCard);
        });
        
        console.log('Algorithms rendered:', this.data.algorithms.length);
    }
    
    renderAlerts() {
        const container = document.getElementById('alertsList');
        if (!container) {
            console.warn('Alerts list container not found');
            return;
        }
        
        container.innerHTML = '';
        
        this.data.alerts.forEach(alert => {
            const alertItem = document.createElement('div');
            alertItem.className = `alert-item ${alert.type.toLowerCase()}`;
            
            alertItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <strong>${alert.type}</strong>
                    <span style="font-size: 12px; color: var(--color-text-secondary);">${alert.timestamp}</span>
                </div>
                <p style="margin: 0; font-size: 14px;">${alert.message}</p>
            `;
            
            container.appendChild(alertItem);
        });
        
        console.log('Alerts rendered:', this.data.alerts.length);
    }
    
    filterTrains(status) {
        const cards = document.querySelectorAll('.train-card');
        console.log('Filtering trains by status:', status);
        
        cards.forEach(card => {
            if (status === 'all') {
                card.style.display = 'block';
            } else {
                const isVisible = card.classList.contains(status);
                card.style.display = isVisible ? 'block' : 'none';
            }
        });
    }
    
    refreshTrainData() {
        const button = document.getElementById('refreshTrains');
        if (!button) return;
        
        button.textContent = 'Refreshing...';
        button.disabled = true;
        
        setTimeout(() => {
            this.simulateDataUpdates();
            this.renderTrains();
            button.textContent = 'Refresh Data';
            button.disabled = false;
            console.log('Train data refreshed');
        }, 1500);
    }
    
    runOptimization() {
        const button = document.getElementById('runOptimization');
        const results = document.getElementById('optimizationResults');
        
        if (!button || !results) {
            console.warn('Optimization elements not found');
            return;
        }
        
        button.textContent = 'Running...';
        button.disabled = true;
        
        setTimeout(() => {
            results.style.display = 'block';
            
            // Simulate optimization results
            const delayReduction = Math.floor(Math.random() * 10) + 15; // 15-25%
            const conflictsResolved = Math.floor(Math.random() * 2) + 2; // 2-3
            const optimizationTime = Math.floor(Math.random() * 20) + 30; // 30-50 seconds
            
            const delayElement = document.getElementById('delayReduction');
            const conflictsElement = document.getElementById('conflictsResolved');
            const timeElement = document.getElementById('optimizationTime');
            
            if (delayElement) delayElement.textContent = `${delayReduction}%`;
            if (conflictsElement) conflictsElement.textContent = `${conflictsResolved} of 3`;
            if (timeElement) timeElement.textContent = `${optimizationTime} seconds`;
            
            button.textContent = 'Run Full Optimization';
            button.disabled = false;
            
            console.log('Optimization completed');
        }, 3000);
    }
    
    resolveConflict(conflictId, action) {
        const conflict = this.data.conflicts.find(c => c.id === conflictId);
        if (conflict) {
            conflict.status = action === 'accept' ? 'Resolved' : 'Rejected';
            this.renderConflicts();
            
            // Update active conflicts count
            const activeCount = this.data.conflicts.filter(c => c.status === 'Pending').length;
            this.data.system_metrics.active_conflicts = activeCount;
            this.data.system_metrics.resolved_today++;
            this.updateMetrics();
            
            console.log(`Conflict ${conflictId} ${action}ed`);
        }
    }
    
    updateMetrics() {
        const elements = {
            totalTrains: document.getElementById('totalTrains'),
            activeConflicts: document.getElementById('activeConflicts'),
            resolvedToday: document.getElementById('resolvedToday'),
            systemUptime: document.getElementById('systemUptime')
        };
        
        if (elements.totalTrains) {
            elements.totalTrains.textContent = this.data.system_metrics.total_trains.toLocaleString();
        }
        if (elements.activeConflicts) {
            elements.activeConflicts.textContent = this.data.system_metrics.active_conflicts;
        }
        if (elements.resolvedToday) {
            elements.resolvedToday.textContent = this.data.system_metrics.resolved_today;
        }
        if (elements.systemUptime) {
            elements.systemUptime.textContent = this.data.system_metrics.system_uptime;
        }
        
        // Update alert count
        const alertCount = document.getElementById('alertCount');
        if (alertCount) {
            alertCount.textContent = this.data.alerts.length;
        }
    }
    
    toggleAlertsPanel() {
        const panel = document.getElementById('alertsPanel');
        if (!panel) {
            console.warn('Alerts panel not found');
            return;
        }
        
        this.alertsOpen = !this.alertsOpen;
        panel.classList.toggle('open', this.alertsOpen);
        console.log('Alerts panel toggled:', this.alertsOpen);
    }
    
    initCharts() {
        this.initPerformanceChart();
    }
    
    initPerformanceChart() {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) {
            console.warn('Performance chart canvas not found');
            return;
        }
        
        try {
            this.charts.performance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['MILP Optimizer', 'Constraint Programming', 'Genetic Algorithm'],
                    datasets: [{
                        label: 'Success Rate (%)',
                        data: [94, 89, 87],
                        backgroundColor: '#1FB8CD',
                        borderColor: '#1FB8CD',
                        borderWidth: 1
                    }, {
                        label: 'Speed Score',
                        data: [7, 9, 4],
                        backgroundColor: '#FFC185',
                        borderColor: '#FFC185',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    }
                }
            });
            console.log('Performance chart initialized');
        } catch (error) {
            console.error('Error initializing performance chart:', error);
        }
    }
    
    initSystemChart() {
        const ctx = document.getElementById('systemPerformanceChart');
        if (!ctx || this.charts.system) {
            console.warn('System chart canvas not found or already initialized');
            return;
        }
        
        try {
            this.charts.system = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'],
                    datasets: [{
                        label: 'Throughput (%)',
                        data: [85, 92, 88, 95, 90, 97],
                        borderColor: '#1FB8CD',
                        backgroundColor: 'rgba(31, 184, 205, 0.1)',
                        fill: true,
                        tension: 0.4
                    }, {
                        label: 'Delay Reduction (%)',
                        data: [15, 18, 16, 22, 19, 25],
                        borderColor: '#FFC185',
                        backgroundColor: 'rgba(255, 193, 133, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    }
                }
            });
            console.log('System chart initialized');
        } catch (error) {
            console.error('Error initializing system chart:', error);
        }
    }
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing dashboard...');
    new RailwayDashboard();
});