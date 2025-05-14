// Constants
const HANGAR_LEVEL_POINTS_REQUIRED = {
    1: 0, 2: 500, 3: 1700, 4: 5500, 5: 11500, 6: 18000, 7: 22000,
    8: 29000, 9: 37000, 10: 45000, 11: 55000, 12: 65000, 13: 75000,
    14: 85000, 15: 100000, 16: 110000, 17: 125000, 18: 140000,
    19: 155000, 20: 170000, 21: Infinity // Represents the points for max level
};

const FREE_PASS = {
    1: 1800, 2: 200, 3: 540, 4: 1800, 5: 540, 6: 250, 7: 540, 8: 1800, 11: 540, 12: 1800, 13: 300, 14: 540, 15: 1800,
    16: 540, 18: 250, 19: 540, 21: 540, 22: 400, 23: 540, 25: 540, 26: 400, 27: 540, 28: 1800, 29: 500, 30: 540,
    31: 1800, 32: 400, 33: 540, 37: 400, 38: 540, 39: 500, 41: 540, 42: 400, 43: 540, 45: 1800, 46: 540, 47: 500,
    48: 540, 49: 600, 50: 1800, 51: 540, 52: 900, 54: 540, 56: 1800, 57: 1200, 59: 1600, 60: 540
};

const PREMIUM_PASS = {
    1: 6000, 2: 1800, 3: 250, 6: 540, 7: 300, 9: 540, 11: 250, 13: 540, 14: 350, 17: 300, 18: 540, 19: 300, 21: 500,
    22: 540, 24: 1800, 28: 500, 30: 540, 32: 540, 33: 400, 34: 540, 36: 400, 37: 1800, 38: 600, 40: 540, 41: 500,
    43: 350, 44: 540, 47: 540, 48: 500, 52: 540, 53: 500, 56: 1000, 57: 1800, 58: 2000
};

// DOM elements
const tabButtons = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const calculateButton = document.getElementById('calculate-button');
let progressionChart = null;

// Tab handling
tabButtons.forEach(button => {
    button.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        
        tabButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === tabId + '-tab') {
                content.classList.add('active');
            }
        });
        
        if (tabId === 'chart') {
            generateProgressionChart();
        }
    });
});

// Initialize hangar level grid
const hangarLevelGrid = document.getElementById('hangar-level-grid');
if (hangarLevelGrid) {
    for (let level = 1; level <= 20; level++) {
        const points = HANGAR_LEVEL_POINTS_REQUIRED[level];
        const nextLevelPoints = HANGAR_LEVEL_POINTS_REQUIRED[level + 1] !== undefined ? HANGAR_LEVEL_POINTS_REQUIRED[level + 1] : Infinity;
        // This grid display interprets HANGAR_LEVEL_POINTS_REQUIRED[level] as cumulative to reach 'level'
        // And pointsNeeded is the cost *within* 'level' (i.e. HANGAR_LEVEL_POINTS_REQUIRED[level+1] - HANGAR_LEVEL_POINTS_REQUIRED[level])
        // This is different from how calculatePointsNeededFromCurrentToTarget now interprets it based on previous user feedback for that specific function.
        // For the grid, the original interpretation is likely intended:
        let pointsNeededForLevel = 0;
        if (level < 20) { // For levels 1-19
            pointsNeededForLevel = HANGAR_LEVEL_POINTS_REQUIRED[level + 1] - HANGAR_LEVEL_POINTS_REQUIRED[level];
        } else if (level === 20) { // For max level 20
             pointsNeededForLevel = HANGAR_LEVEL_POINTS_REQUIRED[level + 1] === Infinity ? 0 : (HANGAR_LEVEL_POINTS_REQUIRED[level+1] - HANGAR_LEVEL_POINTS_REQUIRED[level]); // Should show 0 or N/A for next if max
        }


        const card = document.createElement('div');
        card.className = 'hangar-level-card';
        // Displaying points to *reach* the level, and points *for* that level to get to next.
        card.innerHTML = `
            <h3>Level ${level}</h3>
            <p>Total to reach: ${points.toLocaleString()} points</p> 
            <p>To complete this level: +${level < 20 ? pointsNeededForLevel.toLocaleString() : 'N/A'}</p>
        `;
        hangarLevelGrid.appendChild(card);
    }
}

// Calculator functions
class HangarProgressionCalculator {
    constructor(currentHangarLevel, currentHangarProgress, targetHangarLevel, currentSilver, currentBattlePassTier, ownsPremiumPass) {
        this.currentHangarLevel = currentHangarLevel;
        this.currentHangarProgress = currentHangarProgress;
        this.targetHangarLevel = targetHangarLevel;
        this.currentSilver = currentSilver;
        this.currentBattlePassTier = currentBattlePassTier;
        this.ownsPremiumPass = ownsPremiumPass; // Store the new property
        this.calculate();
    }
    
    calculate() {
        this.neededPoints = this.calculatePointsNeededFromCurrentToTarget();
        
        this.silverShortfall = Math.max(0, this.neededPoints - this.currentSilver);
        
        if (this.ownsPremiumPass) {
            this.retroactivePremiumSilver = 0; 
            this.silverShortfallWithPremium = this.silverShortfall;
        } else {
            this.retroactivePremiumSilver = this.calculatePremiumOnlySilverUpToCurrentTier();
            this.silverShortfallWithPremium = Math.max(0, this.neededPoints - (this.currentSilver + this.retroactivePremiumSilver));
        }

        this.freeTierResult = this._calculatePassProgress(false, this.silverShortfall);
        this.premiumTierResult = this._calculatePassProgress(true, this.silverShortfallWithPremium);
    }
    
    calculatePointsNeededFromCurrentToTarget() {
        if (this.targetHangarLevel <= this.currentHangarLevel) {
            return 0;
        }

        let totalPointsNeeded = 0;

        if (this.currentHangarLevel < 20) { 
            const pointsToClearCurrentLevelFull = HANGAR_LEVEL_POINTS_REQUIRED[this.currentHangarLevel + 1];
            if (pointsToClearCurrentLevelFull !== undefined && pointsToClearCurrentLevelFull !== Infinity) {
                totalPointsNeeded += Math.max(0, pointsToClearCurrentLevelFull - this.currentHangarProgress);
            }
        }

        for (let levelToClear = this.currentHangarLevel + 1; levelToClear < this.targetHangarLevel; levelToClear++) {
            if (levelToClear < 20) {
                const pointsForThis_Intermediate_Level = HANGAR_LEVEL_POINTS_REQUIRED[levelToClear + 1];
                if (pointsForThis_Intermediate_Level !== undefined && pointsForThis_Intermediate_Level !== Infinity) {
                    totalPointsNeeded += pointsForThis_Intermediate_Level;
                } else {
                    console.error(`Error: Points for completing intermediate level ${levelToClear} are undefined or Infinity.`);
                    break; 
                }
            } else {
                break;
            }
        }
        return totalPointsNeeded;
    }
    
    _calculatePassProgress(isPremium, initialShortfall) {
        let shortfallToCover = initialShortfall;
        let accumulatedSilver = 0;
        let tier = this.currentBattlePassTier + 1;
        let tiersUsedCount = 0;
        
        while (tier <= 60 && accumulatedSilver < shortfallToCover) {
            let silverFromTier = FREE_PASS[tier] || 0;
            if (isPremium) {
                silverFromTier += PREMIUM_PASS[tier] || 0;
            }
            accumulatedSilver += silverFromTier;
            tiersUsedCount++;
            tier++;
        }

        if (initialShortfall <= 0) {
            tiersUsedCount = 0;
            tier = this.currentBattlePassTier + 1; 
        }

        return {
            finalTier: Math.min(tier - 1, 60),
            silverAccumulated: accumulatedSilver,
            silverShortfallRemaining: Math.max(0, shortfallToCover - accumulatedSilver),
            tiersUsed: initialShortfall > 0 ? tiersUsedCount : 0
        };
    }
    
    calculatePremiumOnlySilverUpToCurrentTier() {
        let total = 0;
        for (let tier = 1; tier <= this.currentBattlePassTier; tier++) {
            if (PREMIUM_PASS[tier]) {
                total += PREMIUM_PASS[tier];
            }
        }
        return total;
    }
    
    generateProgressionData() {
        const labels = []; 
        const cumulativePointsData = []; 
        const shortfallsData = []; 
        
        labels.push(`Level ${this.currentHangarLevel}`);
        cumulativePointsData.push(0); 
        shortfallsData.push(0);       
        
        for (let level = this.currentHangarLevel + 1; level <= 20; level++) {
            labels.push(`Level ${level}`);
            
            const tempCalculator = new HangarProgressionCalculator(
                this.currentHangarLevel,
                this.currentHangarProgress,
                level,
                this.currentSilver,
                this.currentBattlePassTier,
                this.ownsPremiumPass // Pass the ownsPremiumPass state
            );
            
            const pointsNeeded = tempCalculator.neededPoints;
            const shortfall = Math.max(0, pointsNeeded - this.currentSilver);
            
            cumulativePointsData.push(pointsNeeded);
            shortfallsData.push(shortfall);
        }

        return {
            labels,
            cumulativePointsData,
            shortfallsData
        };
    }
}

// Calculate results and update DOM
function calculateResults() {
    const currentHangarLevel = parseInt(document.getElementById('current-hangar').value) || 1;
    const currentHangarProgress = parseInt(document.getElementById('current-progress').value) || 0;
    let targetHangarLevelInput = document.getElementById('target-hangar');
    let targetHangarLevel = parseInt(targetHangarLevelInput.value) || (currentHangarLevel + 1 > 20 ? 20 : currentHangarLevel + 1) ;
    const currentSilver = parseInt(document.getElementById('current-silver').value) || 0;
    const currentBattlePassTier = parseInt(document.getElementById('battle-pass-tier').value) || 0; // Default to 0 if no tiers passed

    // Read the 'owns-premium-pass' checkbox state
    // IMPORTANT: Make sure you have an input like <input type="checkbox" id="owns-premium-pass"> in your HTML
    const ownsPremiumPassInput = document.getElementById('owns-premium-pass');
    const ownsPremiumPass = ownsPremiumPassInput ? ownsPremiumPassInput.checked : false;
    
    if (targetHangarLevel <= currentHangarLevel && !(targetHangarLevel === 20 && currentHangarLevel === 20)) {
        targetHangarLevel = currentHangarLevel + 1 > 20 ? 20 : currentHangarLevel + 1;
        if (targetHangarLevelInput) targetHangarLevelInput.value = targetHangarLevel;
    } else if (targetHangarLevel > 20) { // Cap target level at 20
        targetHangarLevel = 20;
        if (targetHangarLevelInput) targetHangarLevelInput.value = targetHangarLevel;
    }


    const calculator = new HangarProgressionCalculator(
        currentHangarLevel,
        currentHangarProgress,
        targetHangarLevel,
        currentSilver,
        currentBattlePassTier,
        ownsPremiumPass // Pass the new value
    );
    
    document.getElementById('result-current-level').textContent = calculator.currentHangarLevel;
    document.getElementById('result-target-level').textContent = calculator.targetHangarLevel;
    document.getElementById('result-points-needed').textContent = calculator.neededPoints.toLocaleString();
    document.getElementById('result-current-silver').textContent = calculator.currentSilver.toLocaleString();
    document.getElementById('result-silver-shortfall').textContent = calculator.silverShortfall.toLocaleString();
    
    document.getElementById('result-free-tier').textContent = calculator.freeTierResult.finalTier;
    document.getElementById('result-free-silver').textContent = calculator.freeTierResult.silverAccumulated.toLocaleString();
    document.getElementById('result-free-shortfall').textContent = calculator.freeTierResult.silverShortfallRemaining.toLocaleString();
    document.getElementById('result-free-tiers').textContent = calculator.freeTierResult.tiersUsed;
    
    document.getElementById('result-premium-tier').textContent = calculator.premiumTierResult.finalTier;
    document.getElementById('result-premium-silver').textContent = calculator.premiumTierResult.silverAccumulated.toLocaleString();
    document.getElementById('result-premium-retroactive').textContent = calculator.retroactivePremiumSilver.toLocaleString();
    document.getElementById('result-premium-total').textContent = (calculator.premiumTierResult.silverAccumulated + calculator.retroactivePremiumSilver).toLocaleString();
    document.getElementById('result-premium-shortfall').textContent = calculator.premiumTierResult.silverShortfallRemaining.toLocaleString();
    document.getElementById('result-premium-tiers').textContent = calculator.premiumTierResult.tiersUsed;
    
    const progressSilverBar = document.getElementById('progress-silver');
    if (progressSilverBar) {
        const progressPercent = calculator.neededPoints > 0 ? Math.min(100, (calculator.currentSilver / calculator.neededPoints) * 100) : (calculator.currentSilver > 0 ? 100 : 0);
        progressSilverBar.style.width = `${progressPercent}%`;
    }
    
    return calculator; 
}

// Generate chart
function generateProgressionChart() {
    const calculator = calculateResults(); 
    const data = calculator.generateProgressionData();
    
    const ctx = document.getElementById('progression-chart').getContext('2d');
    
    if (progressionChart) {
        progressionChart.destroy();
    }
    
    progressionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [
                {
                    label: 'Points Required from Current',
                    data: data.cumulativePointsData,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    borderWidth: 2,
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Silver Shortfall from Current (vs. Points Required)',
                    data: data.shortfallsData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.2)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.1,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Hangar Progression Requirements from Current State',
                    font: { size: 16 }
                },
                legend: { position: 'bottom' },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let unit = ' points';
                            if (context.dataset.label.toLowerCase().includes('silver shortfall')) {
                                unit = ' silver (shortfall)';
                            }
                            return context.dataset.label + ': ' + context.raw.toLocaleString() + unit;
                        }
                    }
                }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Amount' },
                    ticks: {
                        callback: function(value) {
                            if (Math.abs(value) >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                            if (Math.abs(value) >= 1000) return (value / 1000).toFixed(1) + 'K';
                            return value;
                        }
                    },
                    beginAtZero: true // Adjusted dynamically if shortfalls are negative, though current logic ensures >= 0
                }
            }
        }
    });
}

// Add event listener for the calculate button
if (calculateButton) {
    calculateButton.addEventListener('click', function() {
        calculateResults();
        const activeTabButton = document.querySelector('.tab.active');
        if (activeTabButton && activeTabButton.getAttribute('data-tab') === 'chart') {
            generateProgressionChart();
        }
    });
}

// Initial calculation on page load
// Ensure DOM is fully loaded before trying to calculate or access elements, especially if script is in <head>
document.addEventListener('DOMContentLoaded', function() {
    calculateResults();
    // If chart is the default active tab and visible, generate it.
    const activeTabOnInit = document.querySelector('.tab.active');
    if (activeTabOnInit && activeTabOnInit.getAttribute('data-tab') === 'chart') {
        // Check if the chart tab content is also active/visible
        const chartTabContent = document.getElementById('chart-tab');
        if (chartTabContent && chartTabContent.classList.contains('active')) {
             generateProgressionChart();
        }
    }
});