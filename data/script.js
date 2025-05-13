// Constants
        const HANGAR_LEVEL_POINTS_REQUIRED = {
            1: 0, 2: 500, 3: 1700, 4: 5500, 5: 11500, 6: 18000, 7: 22000,
            8: 29000, 9: 37000, 10: 45000, 11: 55000, 12: 65000, 13: 75000,
            14: 85000, 15: 100000, 16: 110000, 17: 125000, 18: 140000,
            19: 155000, 20: 170000, 21: Infinity // Represents the points for max level, effectively no further defined level
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
        if (hangarLevelGrid) { // Check if element exists
            for (let level = 1; level <= 20; level++) {
                const points = HANGAR_LEVEL_POINTS_REQUIRED[level];
                // Ensure nextLevelPoints exists, default to Infinity if level 21 is not defined or for calculation purposes
                const nextLevelPoints = HANGAR_LEVEL_POINTS_REQUIRED[level + 1] !== undefined ? HANGAR_LEVEL_POINTS_REQUIRED[level + 1] : Infinity;
                const pointsNeeded = nextLevelPoints !== Infinity ? nextLevelPoints - points : 0; // Display 0 or 'Max' if next level is Infinity
                
                const card = document.createElement('div');
                card.className = 'hangar-level-card';
                card.innerHTML = `
                    <h3>Level ${level}</h3>
                    <p>${points.toLocaleString()} points</p>
                    <p>Next: +${pointsNeeded > 0 ? pointsNeeded.toLocaleString() : (nextLevelPoints === Infinity ? 'N/A' : '0')}</p>
                `;
                hangarLevelGrid.appendChild(card);
            }
        }


        // Calculator functions
        class HangarProgressionCalculator {
            constructor(currentHangarLevel, currentHangarProgress, targetHangarLevel, currentSilver, currentBattlePassTier) {
                this.currentHangarLevel = currentHangarLevel;
                this.currentHangarProgress = currentHangarProgress;
                this.targetHangarLevel = targetHangarLevel;
                this.currentSilver = currentSilver;
                this.currentBattlePassTier = currentBattlePassTier;
                this.calculate();
            }
            
            calculate() {
                // FIX: Calculate total points needed to go from current to target level
                this.neededPoints = this.calculatePointsNeededFromCurrentToTarget();
                
                this.silverShortfall = Math.max(0, this.neededPoints - this.currentSilver);
                
                const retroactivePremiumSilver = this.calculatePremiumOnlySilverUpToCurrentTier();
                this.silverShortfallWithPremium = Math.max(0, this.neededPoints - (this.currentSilver + retroactivePremiumSilver));

                this.freeTierResult = this._calculatePassProgress(false, this.silverShortfall);
                this.premiumTierResult = this._calculatePassProgress(true, this.silverShortfallWithPremium);
                this.retroactivePremiumSilver = retroactivePremiumSilver;
            }
            
            // NEW METHOD: Calculate points needed from current level to target level
            // NEW METHOD: Calculate points needed from current level to target level
            // (Updated based on user feedback for point calculation logic)
            calculatePointsNeededFromCurrentToTarget() {
                // If the target level is not greater than the current level, no points are needed.
                if (this.targetHangarLevel <= this.currentHangarLevel) {
                    return 0;
                }

                // Assumptions based on user's calculation (e.g., L1 to L3 = 2200):
                // HANGAR_LEVEL_POINTS_REQUIRED[N] = XP needed to complete Level N-1 and advance to Level N.
                // Example: HANGAR_LEVEL_POINTS_REQUIRED[2] (500) is the XP to complete Level 1.
                //          HANGAR_LEVEL_POINTS_REQUIRED[3] (1700) is the XP to complete Level 2.

                let totalPointsNeeded = 0;

                // Part 1: Points to complete the currentHangarLevel (to advance to currentHangarLevel + 1).
                // This is applicable only if currentHangarLevel is not the maximum level (e.g., < 20).
                // The cost to complete currentHangarLevel is HANGAR_LEVEL_POINTS_REQUIRED[currentHangarLevel + 1].
                if (this.currentHangarLevel < 20) { // Max defined level that can be "completed" is 19 to reach 20 with finite points.
                                                  // HANGAR_LEVEL_POINTS_REQUIRED[21] is Infinity for completing level 20.
                    const pointsToClearCurrentLevelFull = HANGAR_LEVEL_POINTS_REQUIRED[this.currentHangarLevel + 1];
                    
                    // Ensure pointsToClearCurrentLevelFull is a finite number.
                    // (It should be, as currentHangarLevel + 1 will be at most 20 for this block, 
                    // and HANGAR_LEVEL_POINTS_REQUIRED[20] is finite).
                    if (pointsToClearCurrentLevelFull !== undefined && pointsToClearCurrentLevelFull !== Infinity) {
                        totalPointsNeeded += Math.max(0, pointsToClearCurrentLevelFull - this.currentHangarProgress);
                    }
                }
                // If currentHangarLevel is 20, no points are added for "completing" it,
                // as it's the max level or leads to an 'Infinity' requirement.
                // The initial check (target <= current) handles current=20, target=20 by returning 0.

                // Part 2: Points for all subsequent full intermediate levels that must be completed.
                // These are levels L, where currentHangarLevel < L < targetHangarLevel.
                // For each such level 'L' to clear, the cost is HANGAR_LEVEL_POINTS_REQUIRED[L + 1].
                for (let levelToClear = this.currentHangarLevel + 1; levelToClear < this.targetHangarLevel; levelToClear++) {
                    // Since targetHangarLevel is generally capped at 20 by the calling UI logic,
                    // the maximum value for 'levelToClear' would be 19 (if target is 20).
                    // Therefore, 'levelToClear + 1' would be at most 20.
                    // HANGAR_LEVEL_POINTS_REQUIRED values up to index 20 are finite.
                    
                    // We only add points for levels that can actually be cleared (i.e., levelToClear < 20)
                    if (levelToClear < 20) {
                        const pointsForThis_Intermediate_Level = HANGAR_LEVEL_POINTS_REQUIRED[levelToClear + 1];
                        if (pointsForThis_Intermediate_Level !== undefined && pointsForThis_Intermediate_Level !== Infinity) {
                            totalPointsNeeded += pointsForThis_Intermediate_Level;
                        } else {
                            // This case should ideally not be hit if targetHangarLevel is appropriately constrained (e.g. <= 20)
                            // and HANGAR_LEVEL_POINTS_REQUIRED is well-defined up to level 20's cost.
                            console.error(`Error: Points for completing intermediate level ${levelToClear} are undefined or Infinity.`);
                            // Depending on desired behavior, could return Infinity or break.
                            break; 
                        }
                    } else {
                        // If levelToClear is 20 (meaning targetHangarLevel was > 20 and not capped),
                        // completing level 20 to reach 21 costs Infinity.
                        // This loop structure combined with target level capping should prevent this.
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
                 // If shortfall is 0 initially, 0 tiers are used.
                if (initialShortfall <= 0) {
                    tiersUsedCount = 0;
                    tier = this.currentBattlePassTier +1; // Final tier would be current tier or next if no tiers needed
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
                const labels = []; // Changed from levels to labels for chart clarity
                const cumulativePointsData = []; // Renamed for clarity
                const shortfallsData = []; // Renamed for clarity
                
                // Start with current level data
                labels.push(`Level ${this.currentHangarLevel}`);
                cumulativePointsData.push(0); // At current level, we need 0 additional points
                shortfallsData.push(0);       // At current level, shortfall is also 0
                
                // Calculate for each level from current+1 to 20
                for (let level = this.currentHangarLevel + 1; level <= 20; level++) {
                    labels.push(`Level ${level}`);
                    
                    // Create a temporary calculator to determine points needed to reach this level
                    const tempCalculator = new HangarProgressionCalculator(
                        this.currentHangarLevel,
                        this.currentHangarProgress,
                        level,
                        this.currentSilver,
                        this.currentBattlePassTier
                    );
                    
                    // Get points needed and shortfall for this level
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
            const targetHangarLevel = parseInt(document.getElementById('target-hangar').value) || (currentHangarLevel + 1 > 20 ? 20 : currentHangarLevel + 1) ;
            const currentSilver = parseInt(document.getElementById('current-silver').value) || 0;
            const currentBattlePassTier = parseInt(document.getElementById('battle-pass-tier').value) || 1;
            
            // Basic validation for target level
            if (targetHangarLevel <= currentHangarLevel && !(targetHangarLevel === 20 && currentHangarLevel ===20)) {
                 if (document.getElementById('target-hangar')) document.getElementById('target-hangar').value = currentHangarLevel + 1 > 20 ? 20 : currentHangarLevel +1;
                // Optionally alert user or handle this case, for now, it will calculate for target = current + 1 or 20.
            }


            const calculator = new HangarProgressionCalculator(
                currentHangarLevel,
                currentHangarProgress,
                targetHangarLevel,
                currentSilver,
                currentBattlePassTier
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
            
            const progressPercent = calculator.neededPoints > 0 ? Math.min(100, (calculator.currentSilver / calculator.neededPoints) * 100) : (calculator.currentSilver > 0 ? 100:0);
            document.getElementById('progress-silver').style.width = `${progressPercent}%`;
            
            return calculator; // Return for use by chart generation
        }

        // Generate chart
        function generateProgressionChart() {
            const calculator = calculateResults(); // Recalculate to get fresh data
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
                            label: 'Silver Shortfall from Current',
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
                                    return context.dataset.label + ': ' + context.raw.toLocaleString() + (context.datasetIndex === 0 ? ' points' : ' silver');
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            title: { display: true, text: 'Amount' },
                            ticks: {
                                callback: function(value) {
                                    if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                                    if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
                                    return value;
                                }
                            },
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        // Add event listener for the calculate button
        if (calculateButton) {
            calculateButton.addEventListener('click', function() {
                calculateResults();
                // If chart tab is active, refresh it.
                const activeTabButton = document.querySelector('.tab.active');
                if (activeTabButton && activeTabButton.getAttribute('data-tab') === 'chart') {
                    generateProgressionChart();
                }
            });
        }

        // Initial calculation on page load
        calculateResults();
        // If chart is the default active tab (it's not in this HTML, but if it were):
        // if (document.querySelector('.tab.active[data-tab="chart"]')) {
        //     generateProgressionChart();
        // }